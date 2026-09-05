import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle2, FileText, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange?: string | null;
  description: string;
  requirements: string;
  benefits?: string | null;
  createdAt: string;
  company?: { name: string; website?: string | null };
}

export default function CandidateJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    Promise.all([api.get(`/job/${jobId}`), api.get(`/application/status/${jobId}`)])
      .then(([jobResponse, statusResponse]) => {
        if (!active) return;
        setJob(jobResponse.data as Job);
        setApplied(Boolean(statusResponse.data?.applied));
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [jobId]);

  const handleApply = async () => {
    if (!jobId || applied) return;
    setApplying(true);
    setFeedback(null);
    try {
      await api.post('/application/apply', { jobId });
      setApplied(true);
      setFeedback({ message: 'Application submitted successfully.', success: true });
    } catch (requestError) {
      const response = (requestError as { response?: { status?: number; data?: { code?: string; message?: string } } }).response;
      if (response?.data?.code === 'ALREADY_APPLIED') {
        setApplied(true);
      }
      setFeedback({ message: response?.data?.message || getErrorMessage(requestError), success: false });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải chi tiết việc làm...</div>;
  if (error || !job) return <div className="space-y-4"><button type="button" onClick={() => navigate('/candidate/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to jobs</button><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"><AlertCircle className="mb-2 h-5 w-5" />{error || 'Job not found.'}</div></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/candidate/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Back to jobs</button>
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300"><Building2 className="h-6 w-6" /></div><div><p className="text-sm text-indigo-300">{job.company?.name || 'Company'}</p><h1 className="mt-1 text-3xl font-black">{job.title}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-300" />{job.location}</span><span className="font-semibold text-emerald-300">{job.salaryRange || 'Salary not specified'}</span></div></div></div></section>
      {feedback && <div className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${feedback.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{feedback.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{feedback.message}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Briefcase className="h-5 w-5 text-indigo-600" />Description</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileText className="h-5 w-5 text-indigo-600" />Requirements</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.requirements}</p></section>{job.benefits && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Benefits</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.benefits}</p></section>}</div><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"><h2 className="font-bold text-slate-900">Ready to apply?</h2><p className="mt-2 text-sm text-slate-500">Your current candidate profile will be attached to this application.</p><button type="button" disabled={applied || applying} onClick={() => void handleApply()} className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white ${applied ? 'cursor-not-allowed bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-80`}>{applied ? 'Applied' : applying ? 'Submitting...' : 'Apply now'}</button></aside></div>
    </div>
  );
}
