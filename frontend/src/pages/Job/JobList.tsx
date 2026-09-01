import { useEffect, useMemo, useState } from 'react';
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('srms-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('srms-theme');
      setTheme(savedTheme === 'light' ? 'light' : 'dark');
    };

    syncTheme();
    window.addEventListener('srms-theme-change', syncTheme as EventListener);
    return () => window.removeEventListener('srms-theme-change', syncTheme as EventListener);
  }, []);

  useEffect(() => {
    api
      .get('/job')
      .then((response) => setJobs(Array.isArray(response.data) ? response.data : []))
      .catch(() => setError('Không thể tải danh sách việc làm.'))
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
      setSubmitMessage('Đã gửi hồ sơ ứng tuyển thành công.');
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      setSubmitMessage(response?.data?.message || 'Không thể gửi hồ sơ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDarkTheme = theme === 'dark';

  if (loading) {
    return (
      <div className={`flex min-h-[300px] items-center justify-center text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
        Đang tải danh sách việc làm...
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-6xl px-2 py-3 ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mb-5">
        <div className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          Opportunities
        </div>
        <h1 className={`text-4xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Find your next role</h1>
      </div>

      <div className={`mb-6 border px-3 py-2 text-[15px] shadow-inner ${isDarkTheme ? 'border-[#2d5dff]/60 bg-[#0f1f35] text-slate-200 shadow-blue-500/10' : 'border-blue-200 bg-blue-50 text-slate-700 shadow-blue-100'}`}>
        Explore roles that match your strengths, working style, and next chapter.
      </div>

      <div className={`mb-6 rounded-xl border p-2 shadow-md ${isDarkTheme ? 'border-[#4e5f7a] bg-[#101d30] shadow-slate-950/30' : 'border-slate-200 bg-white shadow-slate-200'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by role, company, or location"
              className={`w-full rounded-lg border bg-transparent py-3 pl-11 pr-3 text-sm focus:outline-none ${
                isDarkTheme
                  ? 'border-[#3b4e68] text-slate-100 placeholder:text-slate-400 focus:border-[#6ca5ff]'
                  : 'border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
              }`}
            />
          </label>

          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={`rounded-lg border bg-transparent px-3 py-3 text-sm outline-none ${
              isDarkTheme
                ? 'border-[#3b4e68] text-slate-200 focus:border-[#6ca5ff]'
                : 'border-slate-200 text-slate-700 focus:border-blue-500'
            }`}
          >
            <option value="all" className={isDarkTheme ? 'bg-[#101d30]' : 'bg-white'}>All locations</option>
            {locations.map((item) => (
              <option key={item} value={item} className={isDarkTheme ? 'bg-[#101d30]' : 'bg-white'}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={`mb-5 rounded-lg border p-3 text-sm ${isDarkTheme ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</div>}

      {filteredJobs.length === 0 ? (
        <div className={`rounded-xl border border-dashed p-12 text-center ${isDarkTheme ? 'border-slate-500 bg-[#101d30]' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className={`mx-auto h-8 w-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
          <p className={`mt-3 text-lg font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>No positions match your search</p>
          <p className={`mt-1 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Try different keywords or location filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className={`flex min-h-[340px] flex-col rounded-2xl border p-4 shadow-[0_0_0_1px_rgba(130,150,180,0.08)] transition ${
                isDarkTheme
                  ? 'border-[#334763] bg-[#0f1d2e] hover:border-[#5a8bff] hover:shadow-[0_18px_40px_rgba(19,46,85,0.38)]'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-[0_18px_40px_rgba(148,163,184,0.2)]'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isDarkTheme ? 'border-[#3a556c] bg-[#111f33] text-[#dfeaff]' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    Full-time
                  </div>
                </div>
              </div>

              <h2 className={`text-[1.9rem] font-black leading-tight tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {job.title}
              </h2>

              <div className={`mt-3 text-base ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>{job.company?.name || 'Company'}</div>

              <p className={`mt-4 flex-1 text-[0.96rem] leading-6 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                {job.description || job.requirements}
              </p>

              <div className={`mt-4 space-y-2 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{job.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#32d296]">{job.salaryRange || 'Competitive compensation'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal(job)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5ea4ff] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(94,164,255,0.35)] transition hover:bg-[#76b3ff]"
              >
                <FileText className="h-4 w-4" />
                View role
              </button>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Đóng"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900">Apply for this role</h3>
            <p className="mt-1 font-semibold text-blue-600">
              {selectedJob.title} - {selectedJob.company?.name}
            </p>

            {submitMessage && (
              <div
                className={`mb-4 mt-4 rounded-lg p-3 text-sm ${
                  submitMessage.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Resume URL</label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Cover letter</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share a brief introduction and why you are a good fit..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 rounded-lg bg-slate-100 p-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-lg bg-blue-600 p-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}