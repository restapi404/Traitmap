"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";

const JOB_FIELDS = [
  "Data Science",
  "Software Development",
  "Healthcare",
  "Finance",
  "Education",
  "Creative Arts",
  "Management",
];

const EDUCATION_OPTIONS = ["B.Tech", "B.E", "B.Sc", "B.A", "M.Tech", "M.Sc", "MBA", "PhD", "Other"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "", email: "", password: "",
    age: "", education_level: "", major_field: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const age = parseInt(form.age) || 0;
  const isAdult = age >= 18;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // Combine education_level with major_field for adults
      const education_level = isAdult
        ? `${form.education_level}${form.major_field ? ` - ${form.major_field}` : ""}`
        : "School";

      const { data } = await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        age: age || null,
        education_level,
      });
      Cookies.set("token", data.access_token, { expires: 7 });
      Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
      router.push("/quiz");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">TraitMap</Link>
          <p className="text-slate-500 mt-2">Create your account to get started</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
              <input className="input" placeholder="Your name" required
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input className="input" type="email" placeholder="you@email.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" required minLength={8}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input className="input" type="number" placeholder="Your age" min={10} max={80} required
                value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              {age > 0 && age < 18 && (
                <p className="text-xs text-brand-500 mt-1">
                  We will recommend careers across all fields based purely on your personality.
                </p>
              )}
              {isAdult && (
                <p className="text-xs text-slate-400 mt-1">
                  We will prioritise careers in your field while also exploring personality matches elsewhere.
                </p>
              )}
            </div>

            {/* Only show for 18+ */}
            {isAdult && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Education level</label>
                  <select className="input" value={form.education_level}
                    onChange={e => setForm({ ...form, education_level: e.target.value })}>
                    <option value="">Select</option>
                    {EDUCATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your field / major
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <select className="input" value={form.major_field}
                    onChange={e => setForm({ ...form, major_field: e.target.value })}>
                    <option value="">Not sure / prefer not to say</option>
                    {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    This helps us include relevant careers in your recommendations.
                  </p>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}