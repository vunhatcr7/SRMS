import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    let active = true;
    api.get('/application/my')
      .then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setError('Không thể tải danh sách đơn ứng tuyển.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải đơn ứng tuyển...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Candidate workspace</p><h1 className="mt-2 text-3xl font-black text-slate-900">My applications</h1><p className="mt-2 text-sm text-slate-600">Track your application stages and matching results in one place.</p></header>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!error && applications.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center"><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold text-slate-800">You have no applications yet</h2><p className="mt-1 text-sm text-slate-500">Explore active jobs and submit your first application.</p><button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Browse jobs</button></div>}
      <div className="space-y-4">{applications.map((application) => <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">{application.job.title}</h2><p className="mt-1 text-sm text-slate-600">{application.job.company?.name || 'Company'} · {application.job.location}</p><p className="mt-2 text-xs text-slate-500">Applied {formatDate(application.createdAt)}</p></div></div><div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStageColor(application.stage)}`}>{getStageLabel(application.stage)}</span>{typeof application.matchingScore === 'number' && <span className={`text-sm font-bold ${getScoreColor(application.matchingScore)}`}>{Math.round(application.matchingScore)}% match</span>}</div></div><button type="button" onClick={() => navigate(`/candidate/applications/${application.id}`)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">View details <ArrowRight className="h-4 w-4" /></button></article>)}</div>
    </div>
  );
}
