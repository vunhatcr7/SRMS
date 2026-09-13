import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Building2, BriefcaseBusiness, FileText, MapPin, Search, X } from 'lucide-react';
import api from '../../api/axios';

interface Company {
  name: string;
}

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange?: string;
  description: string;
  requirements: string;
  benefits?: string;
  company: Company;
  createdAt: string;
}

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    api
      .get('/job')
      .then((response) => setJobs(Array.isArray(response.data) ? response.data : []))
      .catch(() => setError('Unable to load jobs.'))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(
    () => [...new Set(jobs.map((job) => job.location).filter(Boolean))],
    [jobs],
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const searchable = `${job.title} ${job.company?.name || ''} ${job.requirements}`.toLowerCase();
        return searchable.includes(query.toLowerCase()) && (location === 'all' || job.location === location);
      }),
    [jobs, location, query],
  );

  const handleOpenModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setSubmitMessage('');
    setResumeUrl('');
    setCoverLetter('');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await api.post('/application/apply', { jobId: selectedJob.id, resumeUrl, coverLetter });
      setSubmitMessage('Application submitted successfully.');
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      setSubmitMessage(response?.data?.message || 'Unable to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-[300px] items-center justify-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Loading jobs...
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-6xl px-2 py-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mb-5">
        <div className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Opportunities
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Find your next role</h1>
      </div>

      <div className={`mb-6 rounded-lg border p-3 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by role, company, or location"
              className={`w-full rounded border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none transition ${
                isDark ? 'border-navy-700 text-slate-200 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'
              }`}
            />
          </label>

          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={`rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-200 focus:border-brand' : 'border-slate-200 text-slate-700 focus:border-brand'}`}
          >
            <option value="all" className={isDark ? 'bg-navy-800' : 'bg-white'}>All locations</option>
            {locations.map((item) => (
              <option key={item} value={item} className={isDark ? 'bg-navy-800' : 'bg-white'}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={`mb-5 rounded-lg border p-3 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>}

      {filteredJobs.length === 0 ? (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className={`mx-auto h-8 w-8 text-slate-500`} />
          <p className={`mt-3 text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>No positions match your search</p>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Try different keywords or location filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className={`flex min-h-[240px] flex-col rounded-lg border p-4 transition ${
                isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isDark ? 'border-navy-700 bg-navy-850 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Full-time
                  </div>
                </div>
              </div>

              <h2 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {job.title}
              </h2>

              <div className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{job.company?.name || 'Company'}</div>

              <p className={`mt-3 flex-1 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                {job.description || job.requirements}
              </p>

              <div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`} />
                  <span>{job.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">{job.salaryRange || 'Competitive'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal(job)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                <FileText className="h-4 w-4" />
                Apply
              </button>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4">
          <div className={`relative w-full max-w-lg rounded-lg border p-6 shadow-card ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className={`absolute right-4 top-4 transition ${isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100">Apply for this role</h3>
            <p className={`mt-1 font-semibold text-brand-light`}>
              {selectedJob.title} - {selectedJob.company?.name}
            </p>

            {submitMessage && (
              <div
                className={`mb-4 mt-4 rounded-lg p-3 text-sm ${submitMessage.includes('thành công') || submitMessage.includes('success') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}
              >
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Resume URL</label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cover letter</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share a brief introduction and why you are a good fit..."
                  className={`w-full resize-none rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`w-1/3 rounded border px-4 py-2.5 text-sm font-semibold transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



