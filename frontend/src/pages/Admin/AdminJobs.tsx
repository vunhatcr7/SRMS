import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Eye, MapPin, Search } from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';

interface AdminJob {
  id: string;
  title: string;
  description: string;
  requirements: string;
  salaryRange: string | null;
  location: string;
  benefits: string | null;
  isActive: boolean;
  createdAt: string;
  company: { name: string };
  _count?: { applications: number };
}

const PAGE_SIZE = 20;

export default function AdminJobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api.get('/job/manage')
      .then((response) => {
        if (active) setJobs(Array.isArray(response.data) ? response.data as AdminJob[] : []);
      })
      .catch((requestError: unknown) => {
        const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (active) setError(message || 'Không thể tải danh sách tin tuyển dụng.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  };

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) => `${job.title} ${job.company?.name ?? ''} ${job.location}`.toLowerCase().includes(query));
  }, [jobs, search]);
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const visibleJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDetails = async (jobId: string) => {
    setDetailLoading(true);
    setActionError('');
    setSelectedJob(null);
    try {
      const response = await api.get(`/job/manage/${jobId}`);
      setSelectedJob(response.data as AdminJob);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setActionError(message || 'Không thể tải chi tiết tin tuyển dụng.');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleJob = async (job: AdminJob) => {
    const action = job.isActive ? 'đóng' : 'mở lại';
    if (!window.confirm(`Bạn có chắc muốn ${action} tin "${job.title}"?`)) return;

    setUpdatingJobId(job.id);
    setActionError('');
    try {
      const response = await api.patch(`/job/manage/${job.id}/toggle`);
      const updatedJob = response.data.job as AdminJob;
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, ...updatedJob } : item));
      setSelectedJob((current) => current?.id === job.id ? { ...current, ...updatedJob } : current);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setActionError(message || `Không thể ${action} tin tuyển dụng.`);
    } finally {
      setUpdatingJobId('');
    }
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="Job Management" description="Xem chi tiết và quản lý trạng thái tin tuyển dụng." />

      {actionError && (
        <Card className="border-rose-200 text-sm text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
          <p>{actionError}</p>
        </Card>
      )}

      <Card>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Tìm theo chức danh, công ty hoặc địa điểm"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
          />
        </label>
      </Card>

      {error && (
        <Card className="border-rose-200 text-sm text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
          <div className="flex items-center justify-between gap-3">
            <p>{error}</p>
            <button type="button" onClick={retry} className="font-semibold underline">Thử lại</button>
          </div>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-10"><LoadingSpinner message="Đang tải tin tuyển dụng..." /></div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Danh sách tin tuyển dụng chưa tải được.
          </div>
        ) : visibleJobs.length === 0 ? (
          <EmptyState
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="Không tìm thấy tin tuyển dụng"
            description="Thử tìm kiếm bằng từ khóa khác."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tin tuyển dụng</th>
                    <th className="px-4 py-3 font-semibold">Địa điểm</th>
                    <th className="px-4 py-3 font-semibold">Ứng tuyển</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                  {visibleJobs.map((job) => (
                    <tr key={job.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{job.company?.name || '—'}</p>
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span></td>
                      <td className="px-4 py-3">{job._count?.applications ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-slate-300'}`}>
                          {job.isActive ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void openDetails(job.id)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-navy-700 dark:hover:bg-navy-700"
                          >
                            <Eye className="h-3.5 w-3.5" /> Chi tiết
                          </button>
                          <button
                            type="button"
                            disabled={updatingJobId === job.id}
                            onClick={() => void toggleJob(job)}
                            className="rounded border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-navy-700 dark:hover:bg-navy-700"
                          >
                            {updatingJobId === job.id ? 'Đang lưu...' : job.isActive ? 'Đóng tin' : 'Mở lại'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-navy-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>{filteredJobs.length.toLocaleString()} tin tuyển dụng</span>
              <div className="flex items-center gap-2">
                <span>Trang {page} / {Math.max(totalPages, 1)}</span>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Trang trước"
                  className="rounded border border-slate-200 p-1.5 disabled:opacity-40 dark:border-navy-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Trang sau"
                  className="rounded border border-slate-200 p-1.5 disabled:opacity-40 dark:border-navy-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {(selectedJob || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedJob(null);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-job-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-navy-700 dark:bg-navy-800"
          >
            {detailLoading ? (
              <div className="py-12"><LoadingSpinner message="Đang tải chi tiết..." /></div>
            ) : selectedJob && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="admin-job-detail-title" className="text-lg font-bold text-slate-900 dark:text-white">{selectedJob.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedJob.company?.name} · {selectedJob.location}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedJob(null)} aria-label="Đóng" className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700">×</button>
                </div>
                <div className="mt-5 space-y-4 text-sm">
                  <DetailSection title="Mô tả" value={selectedJob.description} />
                  <DetailSection title="Yêu cầu" value={selectedJob.requirements} />
                  <DetailSection title="Quyền lợi" value={selectedJob.benefits} />
                  <DetailSection title="Mức lương" value={selectedJob.salaryRange} />
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={updatingJobId === selectedJob.id}
                    onClick={() => void toggleJob(selectedJob)}
                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    {updatingJobId === selectedJob.id ? 'Đang lưu...' : selectedJob.isActive ? 'Đóng tin tuyển dụng' : 'Mở lại tin tuyển dụng'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, value }: { title: string; value: string | null }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{value || 'Chưa có thông tin.'}</p>
    </div>
  );
}
