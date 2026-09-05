import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getErrorMessage, getScoreColor, getStageColor, getStageLabel } from '../../utils/formatters';

interface Application {
  id: string;
  stage: string;
  matchingScore?: number;
  skillScore?: number;
  experienceScore?: number;
  aiExplanation?: string | null;
  createdAt: string;
  job: { title: string; location: string; description: string; requirements: string; salaryRange?: string | null; company?: { name: string; website?: string | null } };
}

const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

export default function CandidateApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    api.get(`/application/my/${applicationId}`)
      .then((response) => { if (active) setApplication(response.data as Application); })
      .catch((requestError: unknown) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applicationId]);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải chi tiết đơn ứng tuyển...</div>;
  if (error || !application) return <div className="space-y-4"><button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to applications</button><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"><AlertCircle className="mb-2 h-5 w-5" />{error || 'Application not found.'}</div></div>;

  const rejected = application.stage === 'REJECTED';
  const currentIndex = stages.indexOf(application.stage);
  return (
    <div className="mx-auto max-w-4xl space-y-5"><button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Back to applications</button><section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300"><Building2 className="h-6 w-6" /></div><div><p className="text-sm text-indigo-300">{application.job.company?.name || 'Company'}</p><h1 className="mt-1 text-3xl font-black">{application.job.title}</h1><p className="mt-3 text-sm text-slate-300">Applied {formatDate(application.createdAt)} · {application.job.location}</p></div></div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-slate-900">Recruitment progress</h2><p className="mt-1 text-sm text-slate-500">Current stage: <span className={`ml-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStageColor(application.stage)}`}>{getStageLabel(application.stage)}</span></p></div>{typeof application.matchingScore === 'number' && <div className="text-left sm:text-right"><p className="text-xs text-slate-500">Matching score</p><p className={`text-3xl font-black ${getScoreColor(application.matchingScore)}`}>{Math.round(application.matchingScore)}%</p></div>}</div>{rejected ? <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">This application was not selected for the next stage.</div> : <div className="mt-8 grid grid-cols-5 gap-2">{stages.map((stage, index) => { const complete = currentIndex >= index; return <div key={stage} className="text-center"><div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 ${complete ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div><p className={`mt-2 text-[10px] font-semibold sm:text-xs ${complete ? 'text-indigo-700' : 'text-slate-400'}`}>{getStageLabel(stage)}</p>{index < stages.length - 1 && <div className={`relative -mt-5 ml-[60%] hidden h-0.5 w-[80%] sm:block ${currentIndex > index ? 'bg-indigo-600' : 'bg-slate-200'}`} />}</div>; })}</div>}</section><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Briefcase className="h-5 w-5 text-indigo-600" />Job information</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{application.job.description}</p><p className="mt-4 text-sm font-semibold text-emerald-600">{application.job.salaryRange || 'Salary not specified'}</p><h3 className="mt-5 font-bold text-slate-900">Requirements</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{application.job.requirements}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Matching details</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Skills</p><p className="mt-1 text-xl font-bold text-slate-900">{application.skillScore ?? '—'}%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Experience</p><p className="mt-1 text-xl font-bold text-slate-900">{application.experienceScore ?? '—'}%</p></div></div>{application.aiExplanation && <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">{application.aiExplanation}</p>}</section></div></div>
  );
}
