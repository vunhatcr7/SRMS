import { useEffect, useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User, 
  Building2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  BriefcaseBusiness,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDateTime, getErrorMessage } from '../../utils/formatters';

interface CandidateInterviewItem {
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
  };
}

export default function CandidateInterviews() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<CandidateInterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    let active = true;

    api.get('/interview/candidate')
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

  const handleRefresh = () => {
    setRefreshing(true);
    api.get('/interview/candidate')
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

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemStatus = (item.status || 'SCHEDULED').toUpperCase();
      return statusFilter === 'ALL' || itemStatus === statusFilter;
    });
  }, [interviews, statusFilter]);

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
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            <Clock className="h-3 w-3" /> Sắp diễn ra
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Đang tải lịch phỏng vấn của bạn...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Candidate workspace</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 tracking-tight">Lịch phỏng vấn của tôi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi thời gian, hình thức và thông tin các buổi phỏng vấn tuyển dụng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
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

      {/* Tabs */}
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
            onClick={() => setStatusFilter(tab.key as any)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredInterviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có lịch phỏng vấn nào</h3>
          <p className="mt-1 text-xs text-slate-500">
            Khi nhà tuyển dụng lên lịch phỏng vấn cho đơn ứng tuyển của bạn, thông tin sẽ xuất hiện tại đây.
          </p>
          <button
            type="button"
            onClick={() => navigate('/candidate/jobs')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
          >
            Khám phá việc làm
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((item) => {
            const job = item.application?.job;
            const isOnline = (item.type || 'ONLINE').toUpperCase() === 'ONLINE';
            const isLink = item.locationOrLink.startsWith('http://') || item.locationOrLink.startsWith('https://');

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{job?.title || 'Tin tuyển dụng'}</h2>
                        {getStatusBadge(item.status || 'SCHEDULED')}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job?.company?.name || 'Doanh nghiệp'} · {job?.location || 'Việt Nam'}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Time Banner */}
                  <div className="sm:text-right bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 sm:justify-end">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{formatDateTime(item.scheduledAt)}</span>
                    </div>
                    <span className="text-[11px] text-indigo-500 mt-0.5 block">
                      {isOnline ? '🌐 Phỏng vấn trực tuyến' : '🏢 Phỏng vấn trực tiếp'}
                    </span>
                  </div>
                </div>

                {/* Meeting Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-100">
                  {/* Location or Link */}
                  <div className="flex items-start gap-2.5">
                    {isOnline ? (
                      <Video className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 truncate">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {isOnline ? 'Link cuộc họp trực tuyến' : 'Địa điểm phỏng vấn'}
                      </span>
                      {isLink ? (
                        <div className="mt-1">
                          <a
                            href={item.locationOrLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                          >
                            <span>Tham gia cuộc họp</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-800 mt-0.5">{item.locationOrLink}</p>
                      )}
                    </div>
                  </div>

                  {/* Interviewer */}
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Người phỏng vấn</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{item.interviewerName}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
                    <strong className="text-amber-800">Lưu ý từ nhà tuyển dụng:</strong> {item.notes}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
