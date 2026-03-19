"use client";
import Link from "next/link";
import { Brain, TrendingUp, Users, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
        <span className="text-xl font-bold text-brand-600">TraitMap</span>
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm">Log in</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Brain size={15} /> MBTI-based career guidance
        </div>
        <h1 className="text-5xl font-bold text-slate-900 max-w-2xl leading-tight mb-5">
          Find careers that truly <span className="text-brand-600">fit your personality</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mb-10">
          TraitMap combines content-based filtering and collaborative filtering with fuzzy logic
          to match your MBTI personality profile to the most compatible career paths.
        </p>
        <Link href="/auth/register" className="btn-primary text-base flex items-center gap-2">
          Take the free quiz <ChevronRight size={18} />
        </Link>
      </section>

      {/* Features */}
      <section className="py-20 px-8 bg-white">
        <h2 className="text-center text-2xl font-bold mb-12 text-slate-800">How it works</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: <Brain size={28} className="text-brand-600" />, title: "142-Question MBTI Quiz", desc: "Answer the authentic KPMI questionnaire to get an accurate personality profile across all 8 dimensions." },
            { icon: <TrendingUp size={28} className="text-brand-600" />, title: "Hybrid Recommender", desc: "Our algorithm fuses content-based filtering with collaborative filtering using cosine similarity and fuzzy normalisation." },
            { icon: <Users size={28} className="text-brand-600" />, title: "Personalised Results", desc: "See your top 5 career matches with compatibility scores, salary ranges, and field descriptions." },
          ].map((f, i) => (
            <div key={i} className="card flex flex-col gap-3">
              {f.icon}
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-400 text-sm border-t border-slate-100">
        TraitMap · 21CSC205P DBMS Project · Aditi Shikha & Rithu Prabhu · SRM IST 2026
      </footer>
    </main>
  );
}
