"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ChevronLeft, ChevronRight, CheckCircle, Lock } from "lucide-react";
import api from "@/lib/api";
import { questions } from "@/lib/questions";
import Link from "next/link";

const CONFIDENCE_THRESHOLD = 0.68;
const MIN_PER_DIM_BEFORE_LOCK = 6;
const QUESTIONS_PER_PAGE = 5;

type Dim = "EI" | "SN" | "TF" | "JP";
const DIM_LABELS: Record<Dim, [string, string]> = {
  EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"],
};

interface DimState {
  firstScore: number;
  secondScore: number;
  count: number;
  locked: boolean;
  lockedLetter: string | null;
  firstPct: number;
  secondPct: number;
}

// Convert 1-5 scale answer to a score contribution
// positive direction: 1=+2, 2=+1, 3=0, 4=-1, 5=-2  (towards first letter)
// negative direction: reversed
function scaleToScore(value: number, direction: "positive" | "negative"): number {
  const raw = 3 - value; // 1→+2, 2→+1, 3→0, 4→-1, 5→-2
  return direction === "positive" ? raw : -raw;
}

function computeDimScores(answers: Record<number, number>): Record<Dim, DimState> {
  const acc: Record<Dim, { pos: number; neg: number; count: number }> = {
    EI: { pos: 0, neg: 0, count: 0 },
    SN: { pos: 0, neg: 0, count: 0 },
    TF: { pos: 0, neg: 0, count: 0 },
    JP: { pos: 0, neg: 0, count: 0 },
  };

  for (const q of questions) {
    const ans = answers[q.position];
    if (ans === undefined) continue;
    const score = scaleToScore(ans, q.direction);
    if (score > 0) acc[q.dimension].pos += score;
    else if (score < 0) acc[q.dimension].neg += (-score);
    acc[q.dimension].count++;
  }

  const result = {} as Record<Dim, DimState>;
  for (const dim of ["EI", "SN", "TF", "JP"] as Dim[]) {
    const { pos, neg, count } = acc[dim];
    const total = pos + neg || 1;
    const firstPct = Math.round((pos / total) * 100);
    const secondPct = 100 - firstPct;
    const ratio = pos / total;
    let locked = false;
    let lockedLetter: string | null = null;
    if (count >= MIN_PER_DIM_BEFORE_LOCK) {
      if (ratio >= CONFIDENCE_THRESHOLD) { locked = true; lockedLetter = DIM_LABELS[dim][0]; }
      else if (ratio <= (1 - CONFIDENCE_THRESHOLD)) { locked = true; lockedLetter = DIM_LABELS[dim][1]; }
    }
    result[dim] = { firstScore: pos, secondScore: neg, count, locked, lockedLetter, firstPct, secondPct };
  }
  return result;
}

function buildActiveQueue(answers: Record<number, number>, dimScores: Record<Dim, DimState>) {
  return questions.filter(q => {
    const alreadyAnswered = answers[q.position] !== undefined;
    if (alreadyAnswered) return true;
    return !dimScores[q.dimension].locked;
  });
}

function getCurrentMBTI(dimScores: Record<Dim, DimState>) {
  return (["EI", "SN", "TF", "JP"] as Dim[]).map(dim => {
    const { locked, lockedLetter, firstPct } = dimScores[dim];
    if (locked && lockedLetter) return lockedLetter;
    if (dimScores[dim].count === 0) return "?";
    return firstPct >= 50 ? DIM_LABELS[dim][0] : DIM_LABELS[dim][1];
  }).join("");
}

const SCALE_OPTIONS = [
  { value: 5, short: "Strongly\ndisagree", color: "bg-red-100 text-red-800 border-red-300" },
  { value: 4, short: "Disagree",           color: "bg-orange-100 text-orange-800 border-orange-300" },
  { value: 3, short: "Neutral",            color: "bg-slate-100 text-slate-600 border-slate-300" },
  { value: 2, short: "Agree",              color: "bg-brand-100 text-brand-800 border-brand-300" },
  { value: 1, short: "Strongly\nagree",    color: "bg-brand-600 text-white border-brand-600" },
];

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => { if (!Cookies.get("token")) router.replace("/auth/login"); }, [router]);

  const dimScores = useMemo(() => computeDimScores(answers), [answers]);
  const activeQueue = useMemo(() => buildActiveQueue(answers, dimScores), [answers, dimScores]);
  const allLocked = Object.values(dimScores).every(d => d.locked);
  const answeredCount = Object.keys(answers).length;
  const progress = allLocked ? 100 : Math.round((answeredCount / Math.max(activeQueue.length, 1)) * 100);
  const totalPages = Math.ceil(activeQueue.length / QUESTIONS_PER_PAGE);
  const pageQuestions = activeQueue.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);
  const pageAnswered = pageQuestions.every(q => answers[q.position] !== undefined);

  useEffect(() => {
    if (allLocked && answeredCount >= 24) setShowComplete(true);
  }, [allLocked, answeredCount]);

  function selectAnswer(position: number, value: number) {
    setAnswers(prev => ({ ...prev, [position]: value }));
  }

  function nextPage() {
    if (page < totalPages - 1) { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  function prevPage() {
    if (page > 0) { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  async function handleSubmit() {
    if (answeredCount < 20) { setError("Please answer at least 20 questions."); return; }
    setSubmitting(true); setError("");
    try {
      const { data } = await api.post("/quiz/submit", { answers, scale: 5 });
      sessionStorage.setItem("quiz_result", JSON.stringify(data));
      router.push("/results");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const currentMBTI = getCurrentMBTI(dimScores);
  const lockedCount = Object.values(dimScores).filter(d => d.locked).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <span className="font-bold text-brand-600 text-lg shrink-0">TraitMap</span>
          <Link href="/dashboard" className="btn-secondary text-sm">My profile</Link>
          {/* Dimension indicators */}
          <div className="flex items-center gap-1.5">
            {(["EI", "SN", "TF", "JP"] as Dim[]).map(dim => {
              const { locked, lockedLetter, firstPct, count } = dimScores[dim];
              return (
                <div key={dim}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all
                    ${locked ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {locked
                    ? <><Lock size={9} /> {lockedLetter}</>
                    : count > 0
                      ? <><span className="text-slate-400">{DIM_LABELS[dim][0]}</span>
                          <div className="w-6 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${firstPct}%` }} />
                          </div>
                          <span className="text-slate-400">{DIM_LABELS[dim][1]}</span></>
                      : <span className="text-slate-300">{dim}</span>
                  }
                </div>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 shrink-0">{answeredCount}/60</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{lockedCount} of 4 dimensions determined</span>
            <span className="text-brand-600 font-medium">
              {allLocked ? "Ready!" : `~${activeQueue.length - answeredCount} questions left`}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Live MBTI preview */}
        {answeredCount >= 6 && (
          <div className="mb-5 card border-brand-100 bg-gradient-to-r from-brand-50/60 to-slate-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Current estimate</p>
                <p className="text-3xl font-black text-brand-700 tracking-widest">{currentMBTI}</p>
                <p className="text-xs text-slate-400 mt-0.5">Updates as you answer</p>
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                {(["EI", "SN", "TF", "JP"] as Dim[]).map(dim => {
                  const { firstPct, secondPct, locked, count } = dimScores[dim];
                  const [l1, l2] = DIM_LABELS[dim];
                  if (count === 0) return null;
                  return (
                    <div key={dim} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-4 font-bold ${firstPct >= 50 ? "text-brand-600" : "text-slate-400"}`}>{l1}</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden relative">
                        <div className={`h-full rounded-full transition-all duration-300 ${locked ? "bg-brand-500" : "bg-brand-300"}`}
                          style={{ width: `${firstPct}%` }} />
                      </div>
                      <span className={`w-4 font-bold text-right ${secondPct > 50 ? "text-brand-600" : "text-slate-400"}`}>{l2}</span>
                      <span className="w-12 text-right text-slate-500 font-medium">
                        {firstPct >= 50 ? `${firstPct}% ${l1}` : `${secondPct}% ${l2}`}
                      </span>
                      {locked && <span className="text-brand-500 text-xs">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* All locked banner */}
        {showComplete && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Personality determined!</p>
                <p className="text-xs text-green-600">
                  You are <strong>{currentMBTI}</strong> — only {answeredCount} questions needed.
                </p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm shrink-0">
              {submitting ? "..." : "See results →"}
            </button>
          </div>
        )}

        {/* Questions */}
        <div className="flex flex-col gap-4">
          {pageQuestions.map(q => {
            const dimLocked = dimScores[q.dimension].locked;
            const selected = answers[q.position];
            return (
              <div key={q.position}
                className={`card transition-all ${dimLocked ? "opacity-55" : ""} ${selected ? "border-brand-200" : ""}`}>
                <div className="flex items-start gap-3 mb-5">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-600
                                   text-xs font-semibold flex items-center justify-center mt-0.5">
                    {q.position}
                  </span>
                  <div>
                    <p className="text-slate-800 font-medium leading-snug">{q.text}</p>
                    {dimLocked && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-brand-400">
                        <Lock size={9} /> {q.dimension} locked
                      </span>
                    )}
                  </div>
                </div>

                {/* 5-point scale */}
                <div className="grid grid-cols-5 gap-1.5 ml-9">
                  {SCALE_OPTIONS.map(opt => {
                    const isSelected = selected === opt.value;
                    return (
                      <button key={opt.value} onClick={() => selectAnswer(q.position, opt.value)}
                        className={`flex flex-col items-center justify-center px-1 py-2.5 rounded-xl border text-xs
                                    font-medium transition-all leading-tight text-center
                          ${isSelected
                            ? opt.color + " shadow-sm scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                          }`}>
                        {opt.short.split("\n").map((line, i) => <span key={i}>{line}</span>)}
                      </button>
                    );
                  })}
                </div>

                {/* Scale legend */}
                <div className="flex justify-between mt-1.5 ml-9 text-xs text-slate-300">
                  <span>← Disagree</span>
                  <span>Agree →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button onClick={prevPage} disabled={page === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-slate-400">Page {page + 1} / {totalPages}</span>
          {page < totalPages - 1
            ? <button onClick={nextPage}
                className={`flex items-center gap-2 ${pageAnswered ? "btn-primary" : "btn-secondary"}`}>
                Next <ChevronRight size={16} />
              </button>
            : <button onClick={handleSubmit} disabled={submitting || answeredCount < 20}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? "Analysing..." : <><CheckCircle size={16} /> Get results</>}
              </button>
          }
        </div>

        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
        )}
      </main>
    </div>
  );
}
