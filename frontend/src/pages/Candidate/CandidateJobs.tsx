import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Building2, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange?: string | null;
  description: string;
  requirements?: string;
  createdAt: string;
  company?: { name: string };
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));

export default function CandidateJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/job?active=true')
      .then((response) => {
        if (active) setJobs(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (active) setError('Unable to load jobs.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const isDarkTheme = theme === 'dark';
  if (loading) {
    return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkTheme ? 'text-brand-light' : 'text-brand'}`}>Candidate workspace</p>
        <h1 className={`mt-2 text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Find your next role</h1>
        <p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Browse currently active opportunities.</p>
      </div>

      {error && <div className={`rounded-lg border p-4 text-sm ${isDarkTheme ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>}

      {!error && jobs.length === 0 && (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className={`mt-3 font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>No active jobs yet</h2>
          <p className="mt-1 text-sm text-slate-400">Check back later for new opportunities.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <article
            key={job.id}
            className={`flex min-h-[260px] flex-col rounded-lg border p-5 transition ${isDarkTheme ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isDarkTheme ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className={`truncate text-base font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{job.title}</h2>
                <p className={`mt-1 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p>
              </div>
            </div>

            <p className={`mt-4 line-clamp-3 flex-1 text-sm leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              {job.description || job.requirements}
            </p>

            <div className={`mt-4 space-y-2 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                <span>{job.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-400">{job.salaryRange || 'Competitive'}</span>
                <span className={isDarkTheme ? 'text-slate-500' : 'text-slate-500'}>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/candidate/jobs/${job.id}`)}
              className="mt-5 rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View details
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
