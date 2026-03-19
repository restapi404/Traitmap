"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api, { QuizResult, User } from "@/lib/api";
import { Brain, Briefcase, TrendingUp, RefreshCw, LogOut, Building2, Star, ChevronRight } from "lucide-react";

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

function formatSalary(n?: number) {
  if (!n) return null;
  if (n >= 100000) {
    const l = n / 100000;
    return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
  }
  return `₹${Math.round(n).toLocaleString()}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get("token")) { router.replace("/auth/login"); return; }
    Promise.all([
      api.get("/auth/me"),
      api.get("/quiz/my-results").catch(() => null),
    ]).then(([userRes, resultRes]) => {
      setUser(userRes.data);
      if (resultRes) {
        setResult(resultRes.data);
        sessionStorage.setItem("quiz_result", JSON.stringify(resultRes.data));
      }
    }).catch(() => router.replace("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    Cookies.remove("token");
    Cookies.remove("user");
    sessionStorage.removeItem("quiz_result");
    router.push("/");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const colorClass = result ? (MBTI_COLORS[result.mbti_type] || "bg-brand-50 text-brand-800 border-brand-200") : "";

  // Compute dimension percentages
  const dimPcts = result ? {
    ePct: Math.round((result.scores.extraversion_score / (result.scores.extraversion_score + result.scores.introversion_score)) * 100),
    sPct: Math.round((result.scores.sensing_score / (result.scores.sensing_score + result.scores.intuition_score)) * 100),
    tPct: Math.round((result.scores.thinking_score / (result.scores.thinking_score + result.scores.feeling_score)) * 100),
    jPct: Math.round((result.scores.judging_score / (result.scores.judging_score + result.scores.perceiving_score)) * 100),
  } : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-brand-600 text-lg">TraitMap</Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-500">
              Hey, <span className="font-medium text-slate-700">{user.username}</span>
            </span>
          )}
          <Link href="/quiz" className="btn-primary text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> {result ? "Retake quiz" : "Take quiz"}
          </Link>
          <button onClick={logout}
            className="btn-secondary text-sm flex items-center gap-1.5 text-red-500 border-red-200 hover:bg-red-50">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* No results yet */}
        {!result && (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-brand-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No results yet</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Take the MBTI quiz to discover your personality type and get personalised career recommendations.
            </p>
            <Link href="/quiz" className="btn-primary inline-flex items-center gap-2">
              Take the quiz <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* Results exist */}
        {result && dimPcts && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-800">Your profile</h1>
              <Link href="/results" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                Full results <ChevronRight size={14} />
              </Link>
            </div>

            {/* MBTI type card */}
            <div className={`card border-2 ${colorClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-60 mb-1">Your personality type</p>
                  <h2 className="text-5xl font-black mb-1">{result.mbti_type}</h2>
                  <p className="text-lg font-semibold opacity-80">{result.mbti_label}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  {[
                    { l1: "E", p1: dimPcts.ePct, l2: "I", p2: 100 - dimPcts.ePct },
                    { l1: "S", p1: dimPcts.sPct, l2: "N", p2: 100 - dimPcts.sPct },
                    { l1: "T", p1: dimPcts.tPct, l2: "F", p2: 100 - dimPcts.tPct },
                    { l1: "J", p1: dimPcts.jPct, l2: "P", p2: 100 - dimPcts.jPct },
                  ].map(({ l1, p1, l2, p2 }) => (
                    <div key={l1} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-3 font-bold ${p1 >= 50 ? "opacity-100" : "opacity-40"}`}>{l1}</span>
                      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-current rounded-full opacity-70 transition-all"
                          style={{ width: `${p1}%` }} />
                      </div>
                      <span className={`w-3 font-bold ${p2 > 50 ? "opacity-100" : "opacity-40"}`}>{l2}</span>
                      <span className="w-10 text-right opacity-60">
                        {p1 >= 50 ? `${p1}%` : `${p2}%`} {p1 >= 50 ? l1 : l2}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Career matches */}
            <div>
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase size={17} className="text-brand-600" /> Career matches
              </h2>
              <div className="flex flex-col gap-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={`card flex items-center gap-4 py-4
                    ${i === 0 ? "border-brand-300 border-2" : ""}`}>
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm
                      ${i === 0 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {i === 0 ? <Star size={15} /> : `#${rec.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{rec.job_title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Building2 size={11} /> {rec.jobfield_name}</span>
                        {rec.salary_min && rec.salary_max && (
                          <span>{formatSalary(rec.salary_min)} – {formatSalary(rec.salary_max)} / yr</span>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 font-bold text-lg ${i === 0 ? "text-brand-600" : "text-slate-600"}`}>
                      {Math.round(rec.final_score * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Account</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Name</p>
                  <p className="font-medium text-slate-700">{user?.username}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Email</p>
                  <p className="font-medium text-slate-700 truncate">{user?.email}</p>
                </div>
                {user?.age && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Age</p>
                    <p className="font-medium text-slate-700">{user.age}</p>
                  </div>
                )}
                {user?.education_level && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 mb-0.5">Education</p>
                    <p className="font-medium text-slate-700">{user.education_level}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}