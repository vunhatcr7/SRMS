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
  AlertCircle,
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

  const [editingInterview, setEditingInterview] = useState<InterviewData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

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
          setError(getErrorMessage(err) || 'Unable to load interviews.');
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
    api.get('/interview/recruiter')
      .then((res) => {
        setInterviews(Array.isArray(res.data) ? res.data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err) || 'Unable to load interviews.');
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

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

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemStatus = (item.status || 'SCHEDULED').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

      const matchesJob = jobFilter === 'all' || item.application?.job?.id === jobFilter;

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

  const handleMarkCompleted = async (interviewId: string) => {
    try {
      await api.put(`/interview/${interviewId}`, { status: 'COMPLETED' });
      setInterviews((prev) =>
        prev.map((item) => (item.id === interviewId ? { ...item, status: 'COMPLETED' } : item))
      );
      setToast({ message: 'Interview marked as completed.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Unable to update status.', type: 'error' });
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      await api.delete(`/interview/${interviewId}`);
      setInterviews((prev) =>
        prev.map((item) => (item.id === interviewId ? { ...item, status: 'CANCELLED' } : item))
      );
      setToast({ message: 'Interview cancelled successfully.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Unable to cancel interview.', type: 'error' });
    }
  };

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
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-brand mb-3" />
        <p className="text-sm font-medium">Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-card transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <ScheduleInterviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInterview(null);
        }}
        existingInterview={editingInterview}
        onSuccess={() => {
          handleRefresh();
          setToast({ message: 'Interview saved.', type: 'success' });
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Recruiter workspace</p>
          <h1 className="mt-1 text-xl font-bold text-slate-100">Interviews</h1>
          <p className="mt-1 text-xs text-slate-400">
            Track, schedule, and update candidate interview sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded border border-navy-700 bg-navy-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-navy-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className={`rounded-lg border p-3.5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, job, interviewer..."
                className={`w-full rounded border bg-transparent py-2 pl-9 pr-3 text-sm outline-none transition ${
                  isDark ? 'border-navy-700 text-slate-200 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-brand'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 shrink-0" />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className={`rounded border bg-transparent px-3 py-2 text-xs font-medium outline-none transition ${isDark ? 'border-navy-700 text-slate-200 focus:border-brand' : 'border-slate-200 text-slate-700 focus:border-brand'}`}
              >
                <option value="all">All jobs ({jobs.length})</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`text-right text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Showing: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{filteredInterviews.length}</strong> interviews
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-navy-700 pt-3">
          {[
            { key: 'ALL', label: 'All', count: interviews.length },
            { key: 'SCHEDULED', label: 'Scheduled', count: interviews.filter((i) => (i.status || 'SCHEDULED') === 'SCHEDULED').length },
            { key: 'COMPLETED', label: 'Completed', count: interviews.filter((i) => i.status === 'COMPLETED').length },
            { key: 'CANCELLED', label: 'Cancelled', count: interviews.filter((i) => i.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED')}
              className={`rounded px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-brand text-white'
                  : isDark
                    ? 'bg-navy-800 border border-navy-700 text-slate-300 hover:border-navy-600'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-brand-dark text-white' : isDark ? 'bg-navy-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <Calendar className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No interviews found</h3>
          <p className="mt-1 text-xs text-slate-400">
            You can schedule interviews from the Recruitment Pipeline (Interview column).
          </p>
          <button
            type="button"
            onClick={() => navigate('/recruiter/pipeline')}
            className="mt-4 rounded bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            Go to Pipeline
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredInterviews.map((item) => {
            const candidate = item.application?.candidateProfile;
            const user = candidate?.user;
            const fullName = user?.fullName || 'Unnamed candidate';
            const position = candidate?.experience?.position || user?.email || 'Candidate';
            const job = item.application?.job;
            const isOnline = (item.type || 'ONLINE').toUpperCase() === 'ONLINE';
            const isLink = item.locationOrLink.startsWith('http://') || item.locationOrLink.startsWith('https://');

            return (
              <article
                key={item.id}
                className={`rounded-lg border p-4 transition ${isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{fullName}</h3>
                        {getStatusBadge(item.status || 'SCHEDULED')}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{position}</p>
                      <div className={`flex items-center gap-1.5 text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        <Briefcase className={`h-3.5 w-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{job?.title || 'Job'}</span>
                        {job?.company?.name && (
                          <span className="text-slate-500">· {job.company.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`sm:text-right rounded-lg border px-3.5 py-2 ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 sm:justify-end">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      <span>{formatDateTime(item.scheduledAt)}</span>
                    </div>
                    <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Created {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border p-3 text-xs ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Video className="h-4 w-4 text-brand shrink-0" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Type</span>
                      <span className="font-semibold text-slate-200">
                        {isOnline ? 'Online' : 'On-site'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-brand shrink-0" />
                    <div className="truncate">
                      <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Location / Link</span>
                      {isLink ? (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-brand hover:underline inline-flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{item.locationOrLink}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-200 truncate block" title={item.locationOrLink}>
                          {item.locationOrLink}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Interviewer</span>
                      <span className="font-semibold text-slate-200">{item.interviewerName}</span>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className={`mt-3 text-xs rounded-lg border p-2.5 ${isDark ? 'text-slate-400 bg-amber-500/5 border-amber-500/20' : 'text-slate-600 bg-amber-50 border-amber-200'}`}>
                    <strong className="text-amber-500">Notes:</strong> {item.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-navy-700">
                  <div className="flex items-center gap-2">
                    {user?.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/recruiter/candidates/${user.id}`)}
                        className="text-xs font-semibold text-brand hover:text-brand-light transition"
                      >
                        View candidate
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(item.status || 'SCHEDULED') === 'SCHEDULED' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(item.id)}
                        className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1 rounded border border-navy-700 bg-navy-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-navy-600 hover:text-slate-100"
                      title="Edit interview"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    {item.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelInterview(item.id)}
                        className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                        title="Cancel interview"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancel</span>
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
