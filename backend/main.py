from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, quiz

app = FastAPI(
    title="TraitMap API",
    description="Personality-Based Career Recommendation System — 21CSC205P DBMS Project",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(quiz.router)

@app.get("/")
def root():
    return {"message": "TraitMap API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
