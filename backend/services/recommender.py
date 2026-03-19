"""
TraitMap Recommender Engine
Handles both legacy binary answers (0/1) and new 5-point scale answers (1-5).
"""
import numpy as np
from typing import List, Dict, Tuple

# ── Dimension map for new 60-question 5-point scale quiz ──────────────────
# Each question: (dimension, direction)
# direction "positive" → value 1 (strongly agree) scores towards first letter (E/S/T/J)
# direction "negative" → value 1 (strongly agree) scores towards second letter (I/N/F/P)
SCALE_QUESTION_MAP: Dict[int, Tuple[str, str]] = {
  # EI
  1:("EI","positive"), 2:("EI","negative"), 3:("EI","positive"), 4:("EI","negative"),
  5:("EI","positive"), 6:("EI","negative"), 7:("EI","positive"), 8:("EI","negative"),
  9:("EI","positive"),10:("EI","negative"),11:("EI","positive"),12:("EI","negative"),
 13:("EI","positive"),14:("EI","negative"),15:("EI","positive"),
  # SN
 16:("SN","positive"),17:("SN","negative"),18:("SN","positive"),19:("SN","negative"),
 20:("SN","positive"),21:("SN","negative"),22:("SN","positive"),23:("SN","negative"),
 24:("SN","positive"),25:("SN","negative"),26:("SN","positive"),27:("SN","negative"),
 28:("SN","positive"),29:("SN","negative"),30:("SN","positive"),
  # TF
 31:("TF","positive"),32:("TF","negative"),33:("TF","positive"),34:("TF","negative"),
 35:("TF","positive"),36:("TF","negative"),37:("TF","positive"),38:("TF","negative"),
 39:("TF","positive"),40:("TF","negative"),41:("TF","positive"),42:("TF","negative"),
 43:("TF","positive"),44:("TF","negative"),45:("TF","positive"),
  # JP
 46:("JP","positive"),47:("JP","negative"),48:("JP","positive"),49:("JP","negative"),
 50:("JP","positive"),51:("JP","negative"),52:("JP","positive"),53:("JP","negative"),
 54:("JP","positive"),55:("JP","negative"),56:("JP","positive"),57:("JP","negative"),
 58:("JP","positive"),59:("JP","negative"),60:("JP","positive"),
}

DIM_PAIRS = {
    "EI": ("extraversion_score", "introversion_score"),
    "SN": ("sensing_score",      "intuition_score"),
    "TF": ("thinking_score",     "feeling_score"),
    "JP": ("judging_score",      "perceiving_score"),
}


def _scale_to_score(value: int, direction: str) -> float:
    """Convert 1-5 answer to a signed score. Positive = towards first letter."""
    raw = 3 - value  # 1→+2, 2→+1, 3→0, 4→-1, 5→-2
    return float(raw) if direction == "positive" else float(-raw)


def compute_mbti_scores(answers: Dict[int, int], scale: int = 5) -> Dict[str, float]:
    """
    Compute normalised 0-1 MBTI dimension scores.
    scale=5 → new 5-point quiz
    scale=2 → legacy binary quiz (answers are 0 or 1)
    """
    acc = {dim: {"first": 0.0, "second": 0.0} for dim in ["EI", "SN", "TF", "JP"]}

    if scale == 5:
        for q_pos, value in answers.items():
            info = SCALE_QUESTION_MAP.get(int(q_pos))
            if not info:
                continue
            dim, direction = info
            score = _scale_to_score(int(value), direction)
            if score > 0:
                acc[dim]["first"] += score
            elif score < 0:
                acc[dim]["second"] += (-score)
    else:
        # Legacy binary not supported, treat as scale=5
        for q_pos, value in answers.items():
            info = SCALE_QUESTION_MAP.get(int(q_pos))
            if not info:
                continue
            dim, direction = info
            score = _scale_to_score(int(value), direction)
            if score > 0:
                acc[dim]["first"] += score
            elif score < 0:
                acc[dim]["second"] += (-score)

    scores = {}
    for dim, (first_key, second_key) in DIM_PAIRS.items():
        first = acc[dim]["first"]
        second = acc[dim]["second"]
        total = first + second
        if total == 0:
            scores[first_key] = 0.5
            scores[second_key] = 0.5
        else:
            scores[first_key] = round(first / total, 4)
            scores[second_key] = round(second / total, 4)

    return scores


def derive_mbti_type(scores: Dict[str, float]) -> str:
    e_or_i = "E" if scores["extraversion_score"] >= 0.5 else "I"
    s_or_n = "S" if scores["sensing_score"]      >= 0.5 else "N"
    t_or_f = "T" if scores["thinking_score"]     >= 0.5 else "F"
    j_or_p = "J" if scores["judging_score"]      >= 0.5 else "P"
    return e_or_i + s_or_n + t_or_f + j_or_p


def cbf_recommend(user_scores: Dict[str, float], job_profiles: List[Dict], top_n: int = 5) -> List[Dict]:
    scale_keys = ["extraversion_score","introversion_score","sensing_score","intuition_score",
                  "thinking_score","feeling_score","judging_score","perceiving_score"]
    user_vec = np.array([user_scores[k] for k in scale_keys])
    scored = []
    for jp in job_profiles:
        compat = jp.get("compatibility_score", 0) or 0
        fuzzy  = jp.get("fuzzy_normalised_score", 0) or 0
        job_vec = np.array([compat, 1-compat, fuzzy, 1-fuzzy, compat, 1-compat, fuzzy, 1-fuzzy])
        denom = np.linalg.norm(user_vec) * np.linalg.norm(job_vec)
        cbf_score = float(np.dot(user_vec, job_vec) / (denom + 1e-9))
        scored.append({**jp, "cbf_score": round(cbf_score, 6)})
    scored.sort(key=lambda x: x["cbf_score"], reverse=True)
    seen, results = set(), []
    for item in scored:
        if item["job_id"] not in seen:
            seen.add(item["job_id"])
            results.append(item)
        if len(results) >= top_n:
            break
    return results


def hybrid_recommend(user_scores, mbti_type, job_profiles, interaction_matrix,
                     top_n=5, cbf_weight=0.6, cf_weight=0.4):
    cbf_results = {r["job_id"]: r["cbf_score"]
                   for r in cbf_recommend(user_scores, job_profiles, top_n=50)}
    cf_scores: Dict[int, float] = {}
    if mbti_type in interaction_matrix and len(interaction_matrix) > 1:
        user_row = np.array(list(interaction_matrix[mbti_type].values()))
        for other_type, other_row_dict in interaction_matrix.items():
            if other_type == mbti_type:
                continue
            other_row = np.array(list(other_row_dict.values()))
            denom = np.linalg.norm(user_row) * np.linalg.norm(other_row)
            sim = float(np.dot(user_row, other_row) / (denom + 1e-9))
            for jp in job_profiles:
                if jp.get("mbti_type") == other_type:
                    jid = jp["job_id"]
                    cf_scores[jid] = cf_scores.get(jid, 0) + sim * (jp.get("compatibility_score") or 0)
    all_job_ids = set(cbf_results.keys()) | set(cf_scores.keys())
    combined = []
    max_cf = max(cf_scores.values()) if cf_scores else 1
    for jid in all_job_ids:
        cbf = cbf_results.get(jid, 0)
        cf  = cf_scores.get(jid, 0)
        cf_norm = cf / (max_cf + 1e-9)
        hybrid = cbf_weight * cbf + cf_weight * cf_norm
        combined.append({"job_id": jid, "cbf_score": round(cbf,6),
                          "cf_score": round(cf_norm,6), "final_score": round(hybrid,6)})
    combined.sort(key=lambda x: x["final_score"], reverse=True)
    return combined[:top_n]
