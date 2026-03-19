"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { QuizResult } from "@/lib/api";
import { Brain, Briefcase, TrendingUp, RefreshCw, DollarSign, Building2, Star } from "lucide-react";

const MBTI_COLORS: Record<string, string> = {
  INTJ:"bg-purple-50 text-purple-800 border-purple-200", INTP:"bg-blue-50 text-blue-800 border-blue-200",
  ENTJ:"bg-red-50 text-red-800 border-red-200",         ENTP:"bg-orange-50 text-orange-800 border-orange-200",
  INFJ:"bg-teal-50 text-teal-800 border-teal-200",       INFP:"bg-green-50 text-green-800 border-green-200",
  ENFJ:"bg-pink-50 text-pink-800 border-pink-200",       ENFP:"bg-yellow-50 text-yellow-800 border-yellow-200",
  ISTJ:"bg-slate-50 text-slate-800 border-slate-300",    ISFJ:"bg-indigo-50 text-indigo-800 border-indigo-200",
  ESTJ:"bg-cyan-50 text-cyan-800 border-cyan-200",       ESFJ:"bg-rose-50 text-rose-800 border-rose-200",
  ISTP:"bg-zinc-50 text-zinc-800 border-zinc-200",       ISFP:"bg-lime-50 text-lime-800 border-lime-200",
  ESTP:"bg-amber-50 text-amber-800 border-amber-200",    ESFP:"bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
};

function DimensionBar({ label1, pct1, label2, pct2 }: { label1: string; pct1: number; label2: string; pct2: number }) {
  const dominant1 = pct1 >= pct2;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5 text-sm font-medium">
        <span className={dominant1 ? "text-brand-700 font-bold" : "text-slate-400"}>{label1}</span>
        <span className="text-xs text-slate-400">vs</span>
        <span className={!dominant1 ? "text-brand-700 font-bold" : "text-slate-400"}>{label2}</span>
      </div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-brand-500 rounded-l-full transition-all duration-700"
          style={{ width: `${pct1}%` }} />
        <div className="absolute right-0 top-0 h-full bg-brand-200 rounded-r-full transition-all duration-700"
          style={{ width: `${pct2}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-2.5 text-xs font-bold">
          <span className={pct1 > 20 ? "text-white" : "text-brand-600"}>{pct1}%</span>
          <span className={pct2 > 20 ? "text-brand-700" : "text-brand-400"}>{pct2}%</span>
        </div>
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-400">
        <span>{pct1 >= 50 ? `${pct1 - 50 === 0 ? "Balanced" : `${Math.abs(pct1 - 50) * 2}% lean towards ${label1}`}` : ""}</span>
        <span>{pct2 > 50 ? `${Math.abs(pct2 - 50) * 2}% lean towards ${label2}` : ""}</span>
      </div>
    </div>
  );
}

function formatSalary(n?: number) {
  if (!n) return "N/A";
  if (n >= 100000) {
    const lakhs = n / 100000;
    return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
  }
  return `₹${Math.round(n).toLocaleString()}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) { router.replace("/auth/login"); return; }
    const cached = sessionStorage.getItem("quiz_result");
    if (cached) { setResult(JSON.parse(cached)); setLoading(false); }
    else {
      api.get("/quiz/my-results")
        .then(r => { setResult(r.data); setLoading(false); })
        .catch(() => router.replace("/quiz"));
    }
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading your results...</p>
      </div>
    </div>
  );
  if (!result) return null;

  const { mbti_type, mbti_label, scores, recommendations } = result;
  const colorClass = MBTI_COLORS[mbti_type] || "bg-brand-50 text-brand-800 border-brand-200";

  // Compute percentages from raw scores
  const eTotal = (scores.extraversion_score + scores.introversion_score) || 1;
  const ePct = Math.round((scores.extraversion_score / eTotal) * 100);
  const sTotal = (scores.sensing_score + scores.intuition_score) || 1;
  const sPct = Math.round((scores.sensing_score / sTotal) * 100);
  const tTotal = (scores.thinking_score + scores.feeling_score) || 1;
  const tPct = Math.round((scores.thinking_score / tTotal) * 100);
  const jTotal = (scores.judging_score + scores.perceiving_score) || 1;
  const jPct = Math.round((scores.judging_score / jTotal) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-brand-600 text-lg">TraitMap</Link>
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-secondary text-sm">My profile</Link>
          <Link href="/quiz" className="btn-secondary text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> Retake quiz
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">

        {/* Type card */}
        <div className={`card border-2 ${colorClass} text-center`}>
          <div className="flex items-center justify-center gap-2 mb-3 opacity-70">
            <Brain size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Your personality type</span>
          </div>
          <h1 className="text-6xl font-black mb-2">{mbti_type}</h1>
          <p className="text-xl font-semibold mb-3">{mbti_label}</p>
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            Based on your responses, analysed using the TraitMap hybrid recommender system.
          </p>
        </div>

        {/* Dimension breakdown */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" /> Your personality breakdown
          </h2>
          <DimensionBar label1="Extraversion (E)" pct1={ePct}    label2="Introversion (I)" pct2={100 - ePct} />
          <DimensionBar label1="Sensing (S)"      pct1={sPct}    label2="Intuition (N)"    pct2={100 - sPct} />
          <DimensionBar label1="Thinking (T)"     pct1={tPct}    label2="Feeling (F)"      pct2={100 - tPct} />
          <DimensionBar label1="Judging (J)"      pct1={jPct}    label2="Perceiving (P)"   pct2={100 - jPct} />
          <p className="text-xs text-slate-400 mt-4">
            Percentages show strength of preference. Near 50% means balanced — further from 50% means stronger preference.
          </p>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-600" /> Your top career matches
          </h2>
          <div className="flex flex-col gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className={`card ${i === 0 ? "border-brand-300 border-2" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm
                      ${i === 0 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {i === 0 ? <Star size={16} /> : `#${rec.rank}`}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{rec.job_title}</h3>
                        {i === 0 && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Best match</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1"><Building2 size={12} /> {rec.jobfield_name}</span>
                        {rec.department && <span className="flex items-center gap-1"><Briefcase size={12} /> {rec.department}</span>}
                        {rec.salary_min && rec.salary_max && (
                          <span className="flex items-center gap-1"><span className="text-xs"></span>
                            {formatSalary(rec.salary_min)} – {formatSalary(rec.salary_max)} / year
                          </span>
                        )}
                      </div>
                      {rec.job_description && <p className="text-sm text-slate-600 leading-relaxed">{rec.job_description}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-2xl font-bold ${i === 0 ? "text-brand-600" : "text-slate-700"}`}>
                      {Math.round(rec.final_score * 100)}%
                    </div>
                    <div className="text-xs text-slate-400">match</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-8">
          <Link href="/quiz" className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} /> Retake quiz
          </Link>
        </div>
      </main>
    </div>
  );
}
