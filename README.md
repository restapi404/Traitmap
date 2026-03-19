# TraitMap 🧠
### Personality-Based Career Recommendation System

## What is TraitMap?

TraitMap recommends careers based on your personality, not just your qualifications. It uses the MBTI (Myers-Briggs Type Indicator) framework with a hybrid recommendation algorithm combining content-based filtering, collaborative filtering, and fuzzy logic normalisation to match users with the most compatible career paths.

Users take an adaptive 60-question personality quiz (finishing in as few as 24 questions), get their MBTI type with continuous dimension scores, and receive 5 personalised career recommendations with salary ranges — weighted by their field of study for users aged 18+.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+, SQLAlchemy |
| Database | MySQL 8.0 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Algorithm | NumPy, scikit-learn — CBF + CF + Hybrid |

---

## Project Structure

```
traitmap/
├── database/
│   └── traitmap_complete.sql      # Full schema + seed data + all Chapter 3 queries
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example               # Copy to .env and fill in your credentials
│   ├── core/
│   │   ├── database.py            # SQLAlchemy connection
│   │   └── security.py            # JWT + bcrypt
│   ├── models/
│   │   └── db_models.py           # ORM table definitions
│   ├── routers/
│   │   ├── auth.py                # /auth/register, /auth/login, /auth/me
│   │   └── quiz.py                # /quiz/submit, /quiz/my-results
│   └── services/
│       └── recommender.py         # CBF + CF + Hybrid algorithm
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx           # Landing page
    │   │   ├── dashboard/         # Profile + results history
    │   │   ├── auth/              # Register + Login
    │   │   ├── quiz/              # Adaptive 60-question MBTI quiz
    │   │   └── results/           # MBTI type + career recommendations
    │   └── lib/
    │       ├── api.ts             # Axios client + TypeScript types
    │       └── questions.ts       # 60 scenario-based questions
    └── package.json
```

---

## Database Schema

7 tables implementing the relational schema from the ER diagram:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with age and education level |
| `mbti_profiles` | Continuous MBTI dimension scores per user (1-to-1) |
| `job_fields` | Career categories (Data Science, Finance, etc.) |
| `job` | Individual job roles with salary ranges |
| `job_profile` | MBTI-to-job compatibility scores (fuzzy normalised) |
| `USER_JOB_INTERACTION` | Weak entity — tracks user interactions with job fields |
| `recommendations` | Stored recommendation results per user |

**Chapter 3 SQL** — `database/traitmap_complete.sql` contains:
- **3.1** Aggregate functions, GROUP BY, HAVING, SET operations (UNION, INTERSECT, EXCEPT)
- **3.2** INNER/LEFT/RIGHT JOINs, correlated subqueries, EXISTS, 3 meaningful VIEWs
- **3.3** 2 stored functions, 3 triggers, 1 stored procedure with CURSOR + exception handling

---

## Setup

### Prerequisites
- MySQL 8.0+
- Python 3.10+
- Node.js 18+

### 1 — Database

Open MySQL Workbench and run:
```
database/traitmap_complete.sql
```

### 2 — Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
# Edit .env with your MySQL password

uvicorn main:app --reload
```

API docs: http://localhost:8000/docs

### 3 — Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

App: http://localhost:3000

---

## How the Recommender Works

### Adaptive Quiz
Questions are mapped to 4 MBTI dimensions (E/I, S/N, T/F, J/P). After each answer, the system computes a weighted confidence score using the 1–5 scale response (Strongly Agree = ±2, Agree = ±1, Neutral = 0). Once a dimension crosses 68% confidence with at least 6 answers, it locks and those questions are removed from the queue. Most users finish in 24–40 questions.

### Content-Based Filtering (CBF)
Computes cosine similarity between the user's 8-dimensional MBTI vector and each job's fuzzy-normalised compatibility profile from `job_profile`.

### Collaborative Filtering (CF)
Builds a `psychotype × jobfield` interaction matrix. Uses cosine similarity between the user's MBTI type and all other types to weight job field preferences from similar personality types.

### Hybrid Score
```
hybrid_score = 0.6 × CBF_score + 0.4 × CF_score
```

### Age-Aware Ordering
- **Under 18**: Pure personality order, no field bias
- **18+ with declared major**: Top 2 results from user's field + top 3 from other fields, each group sorted by score

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |
| POST | `/quiz/submit` | Submit answers, run recommender, save results |
| GET | `/quiz/my-results` | Fetch saved recommendations |

---

## Source Data

Using the [Kaggle KPMI MBTI Dataset](https://www.kaggle.com/datasets/pmenshih/kpmi-mbti-mod-test).