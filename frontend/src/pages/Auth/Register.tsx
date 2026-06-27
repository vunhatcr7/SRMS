import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      alert('Vui lòng đồng ý điều khoản để tiếp tục.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: `${firstName} ${lastName}`.trim(),
          email,
          password,
          company,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại.');
      }

      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: unknown) {
      const errorWithMessage = err as Error;
      alert(errorWithMessage.message || 'Không thể kết nối đến máy chủ backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_rgb(15,23,42,0.08)] ring-1 ring-slate-200 lg:grid-cols-[1fr_1.2fr]">
        <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-sky-700 via-indigo-600 to-blue-800 px-8 py-10 text-white sm:px-14 lg:px-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-100 shadow-lg shadow-slate-950/10">
              SRMS · AI Recruitment
            </div>
            <h1 className="mt-10 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
              Hire smarter, not harder.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-100/90 sm:text-base">
              Join hundreds of recruiters using SRMS to parse resumes, rank candidates, and run AI-assisted interviews — all in one place.
            </p>
            <div className="mt-10 space-y-3 text-sm text-slate-100/90">
              <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50/15 text-slate-100">✓</span>
                AI resume parsing & ranking
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50/15 text-slate-100">✓</span>
                Kanban pipeline & collaboration
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50/15 text-slate-100">✓</span>
                Voice-to-text interview support
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50/15 text-slate-100">✓</span>
                Bias-aware matching
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-slate-200/80">
            © 2026 SRMS · Graduation Project Simulation
          </div>
        </section>

        <main className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-3xl bg-sky-600 text-white shadow-inner shadow-sky-700/30 flex items-center justify-center text-lg font-black">
                S
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
              <p className="mt-2 text-sm text-slate-500">Start your 14-day free trial. No credit card required.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  First name
                  <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Anna"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>
                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Last name
                  <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nguyen"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account type</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole('CANDIDATE')}
                    className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${role === 'CANDIDATE' ? 'border-sky-600 bg-sky-50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('RECRUITER')}
                    className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${role === 'RECRUITER' ? 'border-sky-600 bg-sky-50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                  >
                    Recruiter
                  </button>
                </div>
              </div>

              <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Work email
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Password
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>
                  I agree to the <a href="#" className="font-semibold text-sky-600 hover:text-sky-500">Terms of Service</a> and <a href="#" className="font-semibold text-sky-600 hover:text-sky-500">Privacy Policy</a>.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Create account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-500">Sign in</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
