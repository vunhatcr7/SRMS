import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, CalendarDays, CircleDollarSign, FileText, MapPin, Search, X } from 'lucide-react';
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
  company: Company;
  createdAt: string;
}

 export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States quản lý Modal ứng tuyển
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/job')
      .then((response) => setJobs(Array.isArray(response.data) ? response.data : []))
      .catch(() => setError('Không thể tải danh sách việc làm.'))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => [...new Set(jobs.map((job) => job.location).filter(Boolean))], [jobs]);
  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const searchable = `${job.title} ${job.company?.name || ''} ${job.requirements}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (location === 'all' || job.location === location);
  }), [jobs, location, query]);

  // Hàm mở modal và thiết lập Job đang được chọn
  const handleOpenModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setSubmitMessage('');
    setResumeUrl('');
    setCoverLetter('');
  };

  // Hàm xử lý gửi đơn ứng tuyển lên Backend
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

  if (loading) return <p className="py-12 text-center text-sm text-slate-500">Đang tải danh sách việc làm...</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><BriefcaseBusiness className="h-4 w-4" /> Việc làm</div><h2 className="mt-2 text-2xl font-bold text-slate-900">Tìm cơ hội phù hợp</h2><p className="mt-1 text-sm text-slate-500">Khám phá vị trí đang tuyển dụng và gửi hồ sơ trực tuyến.</p></div>
        <span className="text-sm text-slate-500">{filteredJobs.length} vị trí</span>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Tìm kiếm việc làm</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo vị trí, công ty hoặc kỹ năng" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></label>
        <select value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"><option value="all">Tất cả địa điểm</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      </section>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      
      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Không tìm thấy vị trí phù hợp</p><p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{filteredJobs.map((job) => <article key={job.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{job.title}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Building2 className="h-4 w-4" />{job.company?.name || 'Chưa cập nhật'}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Đang tuyển</span></div><div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span><span className="flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" />{job.salaryRange || 'Thỏa thuận'}</span><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(job.createdAt).toLocaleDateString('vi-VN')}</span></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p><p className="mt-3 line-clamp-2 text-xs text-slate-500"><strong className="text-slate-700">Yêu cầu:</strong> {job.requirements}</p><button type="button" onClick={() => handleOpenModal(job)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><FileText className="h-4 w-4" />Ứng tuyển</button></article>)}</div>
      )}

      {/* 🔴 GIAO DIỆN MODAL POPUP (Chỉ hiển thị khi mở) */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              aria-label="Đóng"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900">Ứng tuyển vị trí</h3>
            <p className="mt-1 font-semibold text-blue-600">{selectedJob.title} - {selectedJob.company?.name}</p>
            
            {submitMessage && (
              <div className={`mb-4 mt-4 rounded-lg p-3 text-sm ${submitMessage.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Đường dẫn CV</label>
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
                <label className="block text-sm font-semibold text-slate-700">Thư giới thiệu</label>
                <textarea 
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu ngắn gọn về thế mạnh của bạn..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 rounded-lg bg-slate-100 p-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-lg bg-blue-600 p-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {isSubmitting ? '⏳ Đang nộp đơn...' : 'Gửi Đơn Ứng Tuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}