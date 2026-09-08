import { useEffect, useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User, 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, formatDateTime, getErrorMessage, getInitials } from '../../utils/formatters';
import ScheduleInterviewModal from '../../components/ScheduleInterviewModal';
import type { InterviewData } from '../../components/ScheduleInterviewModal';

interface RecruiterInterviewItem {
  id: string;
  applicationId: string;
  scheduledAt: string;
  locationOrLink: string;
  interviewerName: string;
  status: string;
  type?: string;
  notes?: string | null;
  createdAt: string;
  application: {
    id: string;
    stage: string;
    job: {
      id: string;
      title: string;
      location?: string;
      company?: {
        name: string;
        logo?: string;
      };
    };
    candidateProfile: {
      id: string;
      user: {
        id: string;
        fullName?: string;
        email: string;
        phone?: string;
        avatar?: string;
      };
      experience?: {
        position?: string;
        years?: number;
      };
    };
  };
}

export default function RecruiterInterviews() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<RecruiterInterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal editing state
  const [editingInterview, setEditingInterview] = useState<InterviewData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Initial load
  useEffect(() => {
    let active = true;

    api.get('/interview/recruiter')
      .then((res) => {
        if (active) {
          setInterviews(Array.isArray(res.data) ? res.data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err) || 'Không thể tải danh sách phỏng vấn.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    api.get('/interview/recruiter')
      .then((res) => {
        setInterviews(Array.isArray(res.data) ? res.data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err) || 'Không thể tải danh sách phỏng vấn.');
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Distinct jobs for filter
  const jobs = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    interviews.forEach((item) => {
      const job = item.application?.job;
      if (job?.id) {
        map.set(job.id, { id: job.id, title: job.title });
      }
    });
    return Array.from(map.values());
  }, [interviews]);

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      // Status filter
      const itemStatus = (item.status || 'SCHEDULED').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

      // Job filter
      const matchesJob = jobFilter === 'all' || item.application?.job?.id === jobFilter;

      // Search query
      const user = item.application?.candidateProfile?.user;
      const job = item.application?.job;
      const query = search.toLowerCase().trim();
      const matchesSearch = !query ||
        (user?.fullName || '').toLowerCase().includes(query) ||
        (user?.email || '').toLowerCase().includes(query) ||
        (job?.title || '').toLowerCase().includes(query) ||
        (item.interviewerName || '').toLowerCase().includes(query);

      return matchesStatus && matchesJob && matchesSearch;
    });
  }, [interviews, statusFilter, jobFilter, search]);

  // Action: Mark as Completed
  const handleMarkCompleted = async (interviewId: string) => {
    try {
      await api.put(`/interview/${interviewId}`, { status: 'COMPLETED' });
      setInterviews((prev) =>
        prev.map((item) => (item.id === interviewId ? { ...item, status: 'COMPLETED' } : item))
      );
      setToast({ message: 'Đã cập nhật trạng thái phỏng vấn thành hoàn thành.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Không thể cập nhật trạng thái.', type: 'error' });
    }
  };

  // Action: Cancel Interview
  const handleCancelInterview = async (interviewId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch phỏng vấn này?')) {
      return;
    }

    try {
      await api.delete(`/interview/${interviewId}`);
      setInterviews((prev) =>
        prev.map((item) => (item.id === interviewId ? { ...item, status: 'CANCELLED' } : item))
      );
      setToast({ message: 'Đã hủy lịch phỏng vấn thành công.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Không thể hủy lịch phỏng vấn.', type: 'error' });
    }
  };

  // Action: Open Edit Modal
  const handleOpenEdit = (interview: RecruiterInterviewItem) => {
    setEditingInterview({
      id: interview.id,
      applicationId: interview.applicationId,
      scheduledAt: interview.scheduledAt,
      locationOrLink: interview.locationOrLink,
      interviewerName: interview.interviewerName,
      status: interview.status,
      type: interview.type,
      notes: interview.notes,
    });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <XCircle className="h-3 w-3" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <Clock className="h-3 w-3" /> Sắp diễn ra
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Đang tải lịch phỏng vấn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Edit Modal */}
      <ScheduleInterviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInterview(null);
        }}
        existingInterview={editingInterview}
        onSuccess={() => {
          handleRefresh();
          setToast({ message: 'Lịch phỏng vấn đã được lưu.', type: 'success' });
        }}
      />

      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Recruiter workspace</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 tracking-tight">Quản lý lịch phỏng vấn</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi, sắp xếp và cập nhật trạng thái các buổi phỏng vấn ứng viên.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Filter Tabs & Search Bar */}
      <section className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { key: 'ALL', label: 'Tất cả', count: interviews.length },
            { key: 'SCHEDULED', label: 'Sắp diễn ra', count: interviews.filter((i) => (i.status || 'SCHEDULED') === 'SCHEDULED').length },
            { key: 'COMPLETED', label: 'Đã hoàn thành', count: interviews.filter((i) => i.status === 'COMPLETED').length },
            { key: 'CANCELLED', label: 'Đã hủy', count: interviews.filter((i) => i.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm ứng viên, công việc, người phỏng vấn..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Job Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none max-w-xs truncate"
              >
                <option value="all">Tất cả công việc ({jobs.length})</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 font-medium">
            Hiển thị: <strong className="text-slate-700">{filteredInterviews.length}</strong> cuộc phỏng vấn
          </div>
        </div>
      </section>

      {/* Interview Cards List */}
      {filteredInterviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có lịch phỏng vấn nào phù hợp</h3>
          <p className="mt-1 text-xs text-slate-500">
            Bạn có thể lên lịch phỏng vấn mới trực tiếp từ Bảng Kanban tuyển dụng (cột Phỏng vấn).
          </p>
          <button
            type="button"
            onClick={() => navigate('/recruiter/pipeline')}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            Đến trang Pipeline
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((item) => {
            const candidate = item.application?.candidateProfile;
            const user = candidate?.user;
            const fullName = user?.fullName || 'Ứng viên chưa đặt tên';
            const position = candidate?.experience?.position || user?.email || 'Ứng viên';
            const job = item.application?.job;
            const isOnline = (item.type || 'ONLINE').toUpperCase() === 'ONLINE';
            const isLink = item.locationOrLink.startsWith('http://') || item.locationOrLink.startsWith('https://');

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Card Top Row: Candidate + Job + Status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{fullName}</h3>
                        {getStatusBadge(item.status || 'SCHEDULED')}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{position}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{job?.title || 'Tin tuyển dụng'}</span>
                        {job?.company?.name && (
                          <span className="text-slate-400">· {job.company.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interview Date & Time Badge */}
                  <div className="sm:text-right bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 sm:justify-end">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>{formatDateTime(item.scheduledAt)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Tạo ngày {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Meeting Info Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                  {/* Type */}
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Video className="h-4 w-4 text-purple-500 shrink-0" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hình thức</span>
                      <span className="font-semibold text-slate-800">
                        {isOnline ? 'Phỏng vấn trực tuyến' : 'Phỏng vấn trực tiếp'}
                      </span>
                    </div>
                  </div>

                  {/* Location or Link */}
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Địa điểm / Link</span>
                      {isLink ? (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 truncate"
                        >
                          <span>{item.locationOrLink}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-800 truncate" title={item.locationOrLink}>
                          {item.locationOrLink}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interviewer */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Người phỏng vấn</span>
                      <span className="font-semibold text-slate-800">{item.interviewerName}</span>
                    </div>
                  </div>
                </div>

                {/* Notes if present */}
                {item.notes && (
                  <p className="text-xs text-slate-600 bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
                    <strong>Ghi chú:</strong> {item.notes}
                  </p>
                )}

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {user?.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/recruiter/candidates/${user.id}`)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        Xem chi tiết ứng viên
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mark as Completed */}
                    {(item.status || 'SCHEDULED') === 'SCHEDULED' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        title="Đánh dấu đã hoàn thành"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Hoàn thành</span>
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>

                    {/* Cancel */}
                    {item.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelInterview(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        title="Hủy lịch phỏng vấn"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Hủy lịch</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
