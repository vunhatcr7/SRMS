import { useEffect, useState, type FormEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { theme } = useTheme();

  const isDark = theme === 'dark';

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

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading job...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button type="button" onClick={() => navigate(editing ? `/recruiter/jobs/${jobId}` : '/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <h1 className="text-xl font-bold text-slate-100">{editing ? 'Edit job' : 'Create job'}</h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Use the fields supported by the current Job API.</p>
        {message && <div className={`mt-4 rounded-lg border p-3 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message}</div>}

        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`text-sm font-semibold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Title
              <input required value={form.title} onChange={(event) => update('title', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Company
              <input required disabled={editing} value={form.companyName} onChange={(event) => update('companyName', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Location
              <input required value={form.location} onChange={(event) => update('location', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Salary range
              <input value={form.salaryRange} onChange={(event) => update('salaryRange', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
            <label className={`flex items-center gap-2 self-end pb-2.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="h-4 w-4 rounded border-navy-700 bg-navy-800 text-brand focus:ring-brand" />
              Active
            </label>
            <label className={`text-sm font-semibold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Description
              <textarea required value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition resize-none ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
            <label className={`text-sm font-semibold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Requirements
              <textarea required value={form.requirements} onChange={(event) => update('requirements', event.target.value)} rows={4} className={`mt-1 w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition resize-none ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(editing ? `/recruiter/jobs/${jobId}` : '/recruiter/jobs')} className={`rounded border px-4 py-2.5 text-sm font-semibold transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save job</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



