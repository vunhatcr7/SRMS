import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Vui lòng điền email và mật khẩu.');
      }

      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại.');
      }

      const loggedInUser = data.user || data;
      localStorage.setItem(
        'srms_user',
        JSON.stringify({
          fullName: loggedInUser.fullName,
          role: loggedInUser.role,
          email: loggedInUser.email,
        })
      );
      if (data.token) {
        localStorage.setItem('srms_token', data.token);
      }

      if (loggedInUser.role === 'RECRUITER' || loggedInUser.role === 'ADMIN') {
        navigate('/dashboard/recruiter');
      } else {
        navigate('/job/list');
      }
    } catch (err: unknown) {
      const errorWithMessage = err as Error;
      setError(errorWithMessage.message || 'Không thể kết nối đến máy chủ backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_rgb(15,23,42,0.08)] ring-1 ring-slate-200 lg:grid-cols-[1.2fr_1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-700 via-indigo-600 to-blue-800 px-8 py-10 text-white sm:px-14 lg:px-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-100 shadow-lg shadow-slate-950/10">
              SRMS · AI Recruitment
            </div>
            <h1 className="mt-10 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
              Welcome back
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-100/90 sm:text-base">
              Sign in to manage your recruitment pipeline, track vacancies, and find the best talent faster.
            </p>
            <div className="mt-10 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">Candidates parsed</p>
                <strong className="mt-3 block text-3xl font-black">12K+</strong>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">Match accuracy</p>
                <strong className="mt-3 block text-3xl font-black">98%</strong>
              </div>
              <div className="sm:col-span-2 rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-200/80">Faster hiring</p>
                <strong className="mt-3 block text-3xl font-black">47%</strong>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-sm leading-6 text-slate-50/95">
              "SRMS reduced our time-to-hire by 47% and surfaced candidates we would have missed with traditional ATS filters."
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-slate-100/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">LM</div>
              <div>
                <div className="font-semibold">Linh Mai</div>
                <div>Head of Talent, FPT Software</div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-3xl bg-sky-600 text-white shadow-inner shadow-sky-700/30 flex items-center justify-center text-lg font-black">
                S
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Đăng nhập</h2>
              <p className="mt-2 text-sm text-slate-500">Nhập email và mật khẩu để tiếp tục.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</label>
                <div className="mt-2 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mật khẩu</label>
                  <a href="#" className="text-sm font-semibold text-sky-600 hover:text-sky-500">Quên mật khẩu?</a>
                </div>
                <div className="mt-2 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
              Bạn chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-500">Đăng ký ngay</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
