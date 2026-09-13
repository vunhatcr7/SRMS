import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getScoreColor, getStageColor, getStageLabel } from '../../utils/formatters';

interface Application {
  id: string;
  stage: string;
  matchingScore?: number;
  createdAt: string;
  job: { title: string; location: string; company?: { name: string } };
}

export default function CandidateApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  useEffect(() => {
    let active = true;
    api.get('/application/my')
      .then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setError('Unable to load applications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading applications...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Candidate workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">My applications</h1>
        <p className="mt-2 text-sm text-slate-400">Track your application stages and matching results.</p>
      </div>

      {error && <div className={`rounded-lg border p-4 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>}

      {!error && applications.length === 0 && (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className={`mt-3 font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>No applications yet</h2>
          <p className="mt-1 text-sm text-slate-400">Explore active jobs and submit your first application.</p>
          <button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-5 rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
            Browse jobs
          </button>
        </div>
      )}

      <div className="space-y-3">
        {applications.map((application) => (
          <article key={application.id} className={`rounded-lg border p-4 transition ${isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-100">{application.job.title}</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {application.job.company?.name || 'Company'} · {application.job.location}
                  </p>
                  <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Applied {formatDate(application.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded border px-2.5 py-1 text-xs font-semibold ${getStageColor(application.stage)}`}>
                  {getStageLabel(application.stage)}
                </span>
                {typeof application.matchingScore === 'number' && (
                  <span className={`text-sm font-bold ${getScoreColor(application.matchingScore)}`}>
                    {Math.round(application.matchingScore)}%
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy-700 pt-3">
              <button
                type="button"
                onClick={() => navigate(`/candidate/applications/${application.id}`)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition"
              >
                View details <ArrowRight className="h-4 w-4" />
              </button>

              {application.stage === 'INTERVIEW' && (
                <button
                  type="button"
                  onClick={() => navigate('/candidate/interviews')}
                  className="inline-flex items-center gap-1.5 rounded border border-brand/30 bg-brand-muted px-3 py-1.5 text-xs font-bold text-brand-light hover:bg-brand-muted"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View interview schedule</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
