import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

interface FormState { title: string; companyName: string; description: string; requirements: string; salaryRange: string; location: string; isActive: boolean }
const initialForm: FormState = { title: '', companyName: '', description: '', requirements: '', salaryRange: '', location: '', isActive: true };

export default function RecruiterJobForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const editing = Boolean(jobId);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!jobId) return;
    api.get(`/job/manage/${jobId}`).then((response) => { const job = response.data; setForm({ title: job.title || '', companyName: job.company?.name || '', description: job.description || '', requirements: job.requirements || '', salaryRange: job.salaryRange || '', location: job.location || '', isActive: job.isActive }); }).catch((error) => setMessage(getErrorMessage(error))).finally(() => setLoading(false));
  }, [jobId]);

  const update = (field: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (editing) {
        await api.put(`/job/manage/${jobId}`, { title: form.title, description: form.description, requirements: form.requirements, salaryRange: form.salaryRange, location: form.location, isActive: form.isActive });
        navigate(`/recruiter/jobs/${jobId}`);
      } else {
        const response = await api.post('/job/create', form);
        navigate(`/recruiter/jobs/${response.data.job.id}`);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-blue-500" />Đang tải công việc...</div>;
  return <div className="mx-auto max-w-3xl space-y-5"><button type="button" onClick={() => navigate(editing ? `/recruiter/jobs/${jobId}` : '/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" />Back</button><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-black text-slate-900">{editing ? 'Edit job' : 'Create job'}</h1><p className="mt-2 text-sm text-slate-500">Use the fields supported by the current Job API.</p>{message && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{message}</div>}<form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Title<input required value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label><label className="text-sm font-semibold text-slate-700">Company<input required disabled={editing} value={form.companyName} onChange={(event) => update('companyName', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" /></label><label className="text-sm font-semibold text-slate-700">Location<input required value={form.location} onChange={(event) => update('location', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label><label className="text-sm font-semibold text-slate-700">Salary range<input value={form.salaryRange} onChange={(event) => update('salaryRange', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>{editing && <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />Published / active</label>}</div><label className="block text-sm font-semibold text-slate-700">Description<textarea required rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-semibold text-slate-700">Requirements<textarea required rows={5} value={form.requirements} onChange={(event) => update('requirements', event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"><Save className="h-4 w-4" />{saving ? 'Saving...' : editing ? 'Save changes' : 'Create job'}</button></form></div></div>;
}
