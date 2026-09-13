import { type ReactNode } from 'react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-navy-900 text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <span className="grid h-7 w-7 place-items-center rounded bg-brand text-xs text-white">S</span>
            <span>SRMS</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-sm">{description}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} SRMS. Smart Recruitment & AI Talent Matching System.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-navy-850 px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="grid h-7 w-7 place-items-center rounded bg-brand text-xs text-white">S</span>
            <span>SRMS</span>
          </div>
          <div className="lg:hidden mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
