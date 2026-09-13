import type { ReactNode } from 'react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="mb-7 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-100">
          <span className="grid h-7 w-7 place-items-center rounded bg-brand text-xs text-white">S</span>
          <span>SRMS</span>
        </div>
        <p className="auth-kicker">{eyebrow}</p>
        <h1 id="auth-title" className="auth-title">{title}</h1>
        <p className="auth-subtitle">{description}</p>
        {children}
      </section>
    </main>
  );
}
