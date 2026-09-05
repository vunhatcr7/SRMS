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
        if (active) setError('Không thể tải danh sách việc làm.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const isDarkTheme = theme === 'dark';
  if (loading) {
    return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải việc làm...</div>;
  }

  return (
    <div className="space-y-6">
      <header><p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-indigo-300' : 'text-indigo-600'}`}>Candidate workspace</p><h1 className={`mt-2 text-3xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Find your next role</h1><p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>Browse currently active opportunities and open a role to review the full details.</p></header>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!error && jobs.length === 0 && <div className={`rounded-2xl border border-dashed p-12 text-center ${isDarkTheme ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'}`}><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" /><h2 className={`mt-3 font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>No active jobs yet</h2><p className="mt-1 text-sm text-slate-500">Check back later for new opportunities.</p></div>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => <article key={job.id} className={`flex min-h-[300px] flex-col rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 ${isDarkTheme ? 'border-white/10 bg-[#111d34] hover:border-indigo-400/60' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'}`}><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDarkTheme ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}><Building2 className="h-5 w-5" /></div><div className="min-w-0"><h2 className={`truncate text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{job.title}</h2><p className={`mt-1 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p></div></div><p className={`mt-4 line-clamp-3 flex-1 text-sm leading-6 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>{job.description}</p><div className={`mt-4 space-y-2 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-500" />{job.location}</div><div className="flex items-center justify-between gap-2"><span className="font-semibold text-emerald-500">{job.salaryRange || 'Salary not specified'}</span><span>Posted {formatDate(job.createdAt)}</span></div></div><button type="button" onClick={() => navigate(`/candidate/jobs/${job.id}`)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">View details</button></article>)}
      </div>
    </div>
  );
}
