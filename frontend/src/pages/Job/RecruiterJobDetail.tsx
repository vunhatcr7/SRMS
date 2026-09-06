import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, Edit3, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getErrorMessage } from '../../utils/formatters';

interface Job { id: string; title: string; description: string; requirements: string; location: string; salaryRange?: string | null; isActive: boolean; createdAt: string; company?: { name: string }; _count?: { applications: number } }
export default function RecruiterJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!jobId) return;
    let active = true;
    api.get(`/job/manage/${jobId}`).then((response) => { if (active) setJob(response.data); }).catch((error) => { if (active) setMessage(getErrorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId]);
  const toggle = async () => { if (!jobId || !job) return; if (job.isActive && !window.confirm('Đóng công việc này? Ứng viên sẽ không thể nộp đơn mới.')) return; try { const response = await api.patch(`/job/manage/${jobId}/toggle`); setJob(response.data.job); } catch (error) { setMessage(getErrorMessage(error)); } };
  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-blue-500" />Đang tải chi tiết công việc...</div>;
  if (!job) return <div className="space-y-4"><button type="button" onClick={() => navigate('/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Back to jobs</button><div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mb-2 h-5 w-5" />{message || 'Không tìm thấy công việc.'}</div></div>;
  return <div className="mx-auto max-w-4xl space-y-5"><button type="button" onClick={() => navigate('/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Back to jobs</button>{message && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{message}</div>}<section className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex items-start gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/20 text-blue-300"><Building2 className="h-6 w-6" /></div><div><p className="text-sm text-blue-300">{job.company?.name || 'Company'}</p><h1 className="mt-1 text-3xl font-black">{job.title}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span><span className="text-emerald-300">{job.salaryRange || 'Salary not specified'}</span></div></div></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${job.isActive ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-slate-500 bg-slate-700 text-slate-300'}`}>{job.isActive ? 'Active' : 'Closed'}</span></div></section><div className="flex flex-wrap gap-2"><button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Edit3 className="h-4 w-4" />Edit job</button><button type="button" onClick={() => void toggle()} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{job.isActive ? 'Close job' : 'Publish job'}</button></div><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Briefcase className="h-5 w-5 text-blue-600" />Description</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Requirements</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.requirements}</p></section></div><div className="text-xs text-slate-500">Created {formatDate(job.createdAt)} · {job._count?.applications ?? 0} applications</div></div>;
}
