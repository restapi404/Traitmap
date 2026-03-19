from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional

from core.database import get_db
from routers.auth import get_current_user
from models.db_models import User, MBTIProfile, JobProfile, Job, JobField, Recommendation
from services.recommender import compute_mbti_scores, derive_mbti_type, hybrid_recommend

router = APIRouter(prefix="/quiz", tags=["quiz"])


class QuizSubmission(BaseModel):
    answers: Dict[int, int]
    scale: int = 5


class RecommendationOut(BaseModel):
    rank: int
    job_title: str
    job_description: Optional[str]
    department: Optional[str]
    jobfield_name: str
    salary_min: Optional[float]
    salary_max: Optional[float]
    recommendation_type: str
    cbf_score: Optional[float]
    cf_score: Optional[float]
    final_score: float


class QuizResult(BaseModel):
    mbti_type: str
    mbti_label: str
    scores: Dict[str, float]
    recommendations: List[RecommendationOut]


MBTI_LABELS = {
    "INTJ": "The Architect",   "INTP": "The Logician",
    "ENTJ": "The Commander",   "ENTP": "The Debater",
    "INFJ": "The Advocate",    "INFP": "The Mediator",
    "ENFJ": "The Protagonist", "ENFP": "The Campaigner",
    "ISTJ": "The Logistician", "ISFJ": "The Defender",
    "ESTJ": "The Executive",   "ESFJ": "The Consul",
    "ISTP": "The Virtuoso",    "ISFP": "The Adventurer",
    "ESTP": "The Entrepreneur","ESFP": "The Entertainer",
}

# Maps education_level strings to job field names
FIELD_KEYWORDS = {
    "data science":         "Data Science",
    "software":             "Software Development",
    "computer science":     "Software Development",
    "cse":                  "Software Development",
    "it":                   "Software Development",
    "information technology":"Software Development",
    "healthcare":           "Healthcare",
    "medicine":             "Healthcare",
    "nursing":              "Healthcare",
    "finance":              "Finance",
    "accounting":           "Finance",
    "commerce":             "Finance",
    "education":            "Education",
    "teaching":             "Education",
    "arts":                 "Creative Arts",
    "design":               "Creative Arts",
    "media":                "Creative Arts",
    "management":           "Management",
    "business":             "Management",
    "mba":                  "Management",
}


def detect_user_field(education_level: Optional[str]) -> Optional[str]:
    """Extract job field from education_level string."""
    if not education_level:
        return None
    edu_lower = education_level.lower()
    for keyword, field in FIELD_KEYWORDS.items():
        if keyword in edu_lower:
            return field
    return None


def build_age_aware_recommendations(
    hybrid_results: List[Dict],
    job_detail_map: Dict,
    user_age: Optional[int],
    user_field: Optional[str],
    top_n: int = 5
) -> List[Dict]:
    """
    Age-aware recommendation ordering:
    - Under 18 (school): pure personality order, no field bias
    - 18+ with known field: top 2-3 from user's field, rest from other fields
    - 18+ with no field: pure personality order
    """
    is_adult = user_age and user_age >= 18
    
    if not is_adult or not user_field:
        # Pure personality order — just return top_n as-is
        return hybrid_results[:top_n]

    # Split results into in-field and out-of-field
    in_field = []
    out_field = []
    for hr in hybrid_results:
        jid = hr["job_id"]
        details = job_detail_map.get(jid, {})
        if details.get("jobfield_name") == user_field:
            in_field.append(hr)
        else:
            out_field.append(hr)
    in_field = sorted(in_field, key=lambda x: x["final_score"], reverse=True)
    out_field = sorted(out_field, key=lambda x: x["final_score"], reverse=True)

    # Take top 2 from user's field + top 3 from other fields
    # If user's field has fewer than 2, fill remainder from out_field
    field_picks = in_field[:2]
    other_picks = out_field[:3]

    # If we couldn't get 2 from in_field, fill from out_field
    if len(field_picks) < 2:
        extra_needed = 2 - len(field_picks)
        field_picks += out_field[:extra_needed]
        other_picks = out_field[extra_needed:extra_needed + 3]

    combined = field_picks + other_picks
    # Deduplicate by job_id just in case
    seen = set()
    result = []
    for hr in combined:
        if hr["job_id"] not in seen:
            seen.add(hr["job_id"])
            result.append(hr)
        if len(result) >= top_n:
            break

    return result


@router.post("/submit", response_model=QuizResult)
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(submission.answers) < 20:
        raise HTTPException(status_code=400, detail="Too few answers submitted (minimum 20)")

    # 1. Compute MBTI scores
    scores = compute_mbti_scores(submission.answers, scale=submission.scale)
    mbti_type = derive_mbti_type(scores)

    # 2. Upsert MBTI profile
    existing = db.query(MBTIProfile).filter(MBTIProfile.user_id == current_user.user_id).first()
    if existing:
        for k, v in scores.items():
            setattr(existing, k, v)
        existing.mbti_type = mbti_type
        db.commit()
        db.refresh(existing)
    else:
        profile = MBTIProfile(user_id=current_user.user_id, mbti_type=mbti_type, **scores)
        db.add(profile)
        db.commit()

    # 3. Load all job profiles from DB
    rows = db.query(JobProfile, Job, JobField)\
        .join(Job, JobProfile.job_id == Job.job_id)\
        .join(JobField, JobProfile.jobfield_id == JobField.jobfield_id)\
        .all()

    job_profiles = []
    for jp, j, jf in rows:
        job_profiles.append({
            "job_id":                jp.job_id,
            "jobfield_id":           jp.jobfield_id,
            "mbti_type":             jp.mbti_type,
            "compatibility_score":   jp.compatibility_score or 0,
            "fuzzy_normalised_score":jp.fuzzy_normalised_score or 0,
            "weighted_scale_sum":    jp.weighted_scale_sum or 0,
            "job_title":             j.job_title,
            "job_description":       j.job_description,
            "department":            j.department,
            "salary_min":            j.salary_min,
            "salary_max":            j.salary_max,
            "jobfield_name":         jf.jobfield_name,
        })

    if not job_profiles:
        raise HTTPException(status_code=500, detail="No job profiles found in database.")

    # 4. Build interaction matrix with aligned keys
    all_jobfields = sorted(set(jp["jobfield_name"] for jp in job_profiles))
    matrix: Dict[str, Dict[str, float]] = {}
    for jp in job_profiles:
        mt = jp["mbti_type"]
        if mt not in matrix:
            matrix[mt] = {jf: 0.0 for jf in all_jobfields}
        jf_name = jp["jobfield_name"]
        matrix[mt][jf_name] = max(matrix[mt].get(jf_name, 0), jp["compatibility_score"])

    # 5. Run hybrid recommender (get top 20 to have enough to reorder)
    try:
        hybrid_results = hybrid_recommend(scores, mbti_type, job_profiles, matrix, top_n=20)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommender error: {str(e)}")

    if not hybrid_results:
        raise HTTPException(status_code=500, detail="Recommender returned no results.")

    # 6. Map job_id to details
    job_detail_map = {}
    for jp in job_profiles:
        if jp["job_id"] not in job_detail_map:
            job_detail_map[jp["job_id"]] = jp

    # 7. Detect user's field and age for smart reordering
    user_field = detect_user_field(current_user.education_level)
    user_age = current_user.age

    # 8. Apply age-aware reordering
    final_results = build_age_aware_recommendations(
        hybrid_results, job_detail_map, user_age, user_field, top_n=5
    )

    # 9. Save recommendations
    db.query(Recommendation).filter(Recommendation.user_id == current_user.user_id).delete()
    db.commit()

    recommendations_out = []
    for rank, hr in enumerate(final_results, start=1):
        jid = hr["job_id"]
        details = job_detail_map.get(jid, {})
        rec = Recommendation(
            user_id=current_user.user_id,
            job_id=jid,
            recommendation_type="HYBRID",
            cbf_score=hr.get("cbf_score"),
            cf_score=hr.get("cf_score"),
            final_score=hr["final_score"],
            rank_position=rank,
        )
        db.add(rec)
        recommendations_out.append(RecommendationOut(
            rank=rank,
            job_title=details.get("job_title", ""),
            job_description=details.get("job_description"),
            department=details.get("department"),
            jobfield_name=details.get("jobfield_name", ""),
            salary_min=details.get("salary_min"),
            salary_max=details.get("salary_max"),
            recommendation_type="HYBRID",
            cbf_score=hr.get("cbf_score"),
            cf_score=hr.get("cf_score"),
            final_score=hr["final_score"],
        ))

    db.commit()

    # 10. Log interaction
    try:
        top_jid = final_results[0]["job_id"]
        top_jf_id = job_detail_map.get(top_jid, {}).get("jobfield_id")
        if top_jf_id:
            from sqlalchemy import text
            db.execute(text(
                "INSERT INTO USER_JOB_INTERACTION "
                "(user_id, jobfield_id, interaction_type, satisfied) "
                "VALUES (:uid, :jfid, 'quiz_completed', 1)"
            ), {"uid": current_user.user_id, "jfid": top_jf_id})
            db.commit()
    except Exception:
        pass

    return QuizResult(
        mbti_type=mbti_type,
        mbti_label=MBTI_LABELS.get(mbti_type, "Unknown"),
        scores=scores,
        recommendations=recommendations_out,
    )


@router.get("/my-results", response_model=QuizResult)
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(MBTIProfile).filter(MBTIProfile.user_id == current_user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No quiz results found. Please take the quiz first.")

    scores = {
        "extraversion_score": profile.extraversion_score or 0.5,
        "introversion_score": profile.introversion_score or 0.5,
        "sensing_score":      profile.sensing_score or 0.5,
        "intuition_score":    profile.intuition_score or 0.5,
        "thinking_score":     profile.thinking_score or 0.5,
        "feeling_score":      profile.feeling_score or 0.5,
        "judging_score":      profile.judging_score or 0.5,
        "perceiving_score":   profile.perceiving_score or 0.5,
    }

    recs = db.query(Recommendation, Job, JobField)\
        .join(Job, Recommendation.job_id == Job.job_id)\
        .join(JobField, Job.jobfield_id == JobField.jobfield_id)\
        .filter(Recommendation.user_id == current_user.user_id)\
        .order_by(Recommendation.rank_position)\
        .all()

    recommendations_out = [
        RecommendationOut(
            rank=r.rank_position,
            job_title=j.job_title,
            job_description=j.job_description,
            department=j.department,
            jobfield_name=jf.jobfield_name,
            salary_min=j.salary_min,
            salary_max=j.salary_max,
            recommendation_type=r.recommendation_type,
            cbf_score=r.cbf_score,
            cf_score=r.cf_score,
            final_score=r.final_score,
        )
        for r, j, jf in recs
    ]

    return QuizResult(
        mbti_type=profile.mbti_type,
        mbti_label=MBTI_LABELS.get(profile.mbti_type, "Unknown"),
        scores=scores,
        recommendations=recommendations_out,
    )