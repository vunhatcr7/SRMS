import React, { useEffect, useMemo, useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  CalendarPlus,
  Eye, 
  Filter, 
  GripVertical, 
  RefreshCw, 
  Search, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getErrorMessage, getInitials, getStageLabel } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';
import ScheduleInterviewModal from '../../components/ScheduleInterviewModal';

interface Application {
  id: string;
  stage: string;
  matchingScore: number;
  skillScore?: number;
  experienceScore?: number;
  aiExplanation?: string | null;
  createdAt: string;
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
    skills?: string[];
    experience?: {
      position?: string;
      years?: number;
    };
    user: {
      id: string;
      fullName?: string;
      email: string;
      avatar?: string;
      phone?: string;
    };
  };
}

interface ColumnConfig {
  key: string;
  label: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

const PIPELINE_COLUMNS: ColumnConfig[] = [
  { key: 'APPLIED', label: 'Đã nộp đơn', color: 'text-blue-600', badgeBg: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-200' },
  { key: 'SCREENING', label: 'Lọc hồ sơ', color: 'text-purple-600', badgeBg: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-200' },
  { key: 'INTERVIEW', label: 'Phỏng vấn', color: 'text-amber-600', badgeBg: 'bg-amber-100 text-amber-800', borderColor: 'border-amber-200' },
  { key: 'OFFER', label: 'Gửi Offer', color: 'text-pink-600', badgeBg: 'bg-pink-100 text-pink-800', borderColor: 'border-pink-200' },
  { key: 'HIRED', label: 'Đã tuyển', color: 'text-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-800', borderColor: 'border-emerald-200' },
  { key: 'REJECTED', label: 'Từ chối', color: 'text-rose-600', badgeBg: 'bg-rose-100 text-rose-800', borderColor: 'border-rose-200' },
];

export default function RecruiterPipeline() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Drag-and-drop states
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Schedule Interview Modal state
  const [scheduleModalApp, setScheduleModalApp] = useState<{
    applicationId: string;
    candidateName: string;
    jobTitle: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial load
  useEffect(() => {
    let active = true;

    api.get('/application/recruiter')
      .then((res) => {
        if (active) {
          setApplications(Array.isArray(res.data) ? res.data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err) || 'Không thể tải danh sách ứng tuyển pipeline.');
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
    api.get('/application/recruiter')
      .then((res) => {
        setApplications(Array.isArray(res.data) ? res.data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err) || 'Không thể tải danh sách ứng tuyển pipeline.');
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Distinct list of jobs managed by recruiter
  const jobs = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    applications.forEach((app) => {
      if (app.job?.id) {
        map.set(app.job.id, { id: app.job.id, title: app.job.title });
      }
    });
    return Array.from(map.values());
  }, [applications]);

  // Filter applications by selected job and search query
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesJob = jobFilter === 'all' || app.job?.id === jobFilter;
      const candidateName = app.candidateProfile?.user?.fullName || '';
      const candidateEmail = app.candidateProfile?.user?.email || '';
      const candidatePos = app.candidateProfile?.experience?.position || '';
      const query = search.toLowerCase().trim();
      const matchesSearch = !query || 
        candidateName.toLowerCase().includes(query) || 
        candidateEmail.toLowerCase().includes(query) || 
        candidatePos.toLowerCase().includes(query) ||
        app.job?.title?.toLowerCase().includes(query);

      return matchesJob && matchesSearch;
    });
  }, [applications, jobFilter, search]);

  // Group applications by stage
  const groupedByStage = useMemo(() => {
    const groups: Record<string, Application[]> = {
      APPLIED: [],
      SCREENING: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
    };

    filteredApplications.forEach((app) => {
      const stage = app.stage || 'APPLIED';
      if (groups[stage]) {
        groups[stage].push(app);
      } else {
        groups.APPLIED.push(app);
      }
    });

    return groups;
  }, [filteredApplications]);

  // Core Stage Update Handler (Optimistic UI + Revert on Failure)
  const handleStageChange = async (applicationId: string, newStage: string, prevStage: string) => {
    if (newStage === prevStage) return;

    // 1. Optimistically update local state
    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
    );

    try {
      // 2. Call backend API
      const res = await api.put('/application/update-stage', {
        applicationId,
        stage: newStage,
      });

      // 3. Confirm with updated data from server if returned
      if (res.data?.application) {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, ...res.data.application } : app))
        );
      }

      setToast({
        message: `Đã chuyển ứng viên sang "${getStageLabel(newStage)}"`,
        type: 'success',
      });
    } catch (err: unknown) {
      // 4. Revert UI on failure
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, stage: prevStage } : app))
      );
      setToast({
        message: getErrorMessage(err) || 'Cập nhật giai đoạn thất bại. Đã khôi phục trạng thái.',
        type: 'error',
      });
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, applicationId: string, currentStage: string) => {
    setDraggedAppId(applicationId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ applicationId, currentStage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stageKey) {
      setDragOverColumn(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === stageKey) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedAppId(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data?.applicationId && data?.currentStage) {
        handleStageChange(data.applicationId, targetStage, data.currentStage);
      }
    } catch {
      // Fallback
    }
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverColumn(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Đang tải Recruitment Pipeline...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Recruiter Pipeline
            </span>
            <span className="text-xs text-slate-500">
              {filteredApplications.length} ứng viên
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
            Quy trình tuyển dụng (Kanban)
          </h1>
          <p className="text-xs text-slate-500">
            Kéo thả thẻ ứng viên giữa các cột để cập nhật tiến độ tuyển dụng theo thời gian thực.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, vị trí..."
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

        {/* Status indicator */}
        <div className="text-right text-xs text-slate-400 font-medium">
          Hiển thị: <strong className="text-slate-700">{filteredApplications.length}</strong> hồ sơ
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-w-[1300px] w-full items-start">
          {PIPELINE_COLUMNS.map((column) => {
            const columnApps = groupedByStage[column.key] || [];
            const isTargetOver = dragOverColumn === column.key;

            return (
              <div
                key={column.key}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDragLeave={(e) => handleDragLeave(e, column.key)}
                onDrop={(e) => handleDrop(e, column.key)}
                className={`flex flex-col w-[280px] shrink-0 rounded-2xl border transition-all duration-200 ${
                  isTargetOver
                    ? 'border-blue-500 bg-blue-50/40 shadow-md ring-2 ring-blue-400/20'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/80 bg-white/70 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      column.key === 'APPLIED' ? 'bg-blue-500' :
                      column.key === 'SCREENING' ? 'bg-purple-500' :
                      column.key === 'INTERVIEW' ? 'bg-amber-500' :
                      column.key === 'OFFER' ? 'bg-pink-500' :
                      column.key === 'HIRED' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {column.label}
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${column.badgeBg}`}>
                    {columnApps.length}
                  </span>
                </div>

                {/* Column Dropzone / Cards Container */}
                <div className="flex flex-col gap-3 p-3 min-h-[500px] max-h-[calc(100vh-260px)] overflow-y-auto">
                  {columnApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-slate-200 text-slate-400 text-center p-3">
                      <p className="text-xs">Chưa có ứng viên</p>
                      <p className="text-[10px] text-slate-400 mt-1">Kéo thả hồ sơ vào đây</p>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const candidate = app.candidateProfile;
                      const user = candidate?.user;
                      const fullName = user?.fullName || 'Ứng viên chưa đặt tên';
                      const position = candidate?.experience?.position || user?.email || 'Ứng viên';
                      const isBeingDragged = draggedAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id, app.stage)}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing ${
                            isBeingDragged ? 'opacity-40 scale-95 border-dashed border-blue-400' : ''
                          }`}
                        >
                          {/* Drag handle indicator */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                                {getInitials(fullName)}
                              </div>
                              <div className="max-w-[150px]">
                                <h4 className="text-xs font-bold text-slate-900 truncate" title={fullName}>
                                  {fullName}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate" title={position}>
                                  {position}
                                </p>
                              </div>
                            </div>
                            <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                          </div>

                          {/* Job Title */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 mb-2 truncate">
                            <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate" title={app.job?.title}>
                              {app.job?.title || 'Công việc'}
                            </span>
                          </div>

                          {/* Score and Date */}
                          <div className="flex items-center justify-between text-[11px] mb-3">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(app.createdAt)}</span>
                            </div>
                            {typeof app.matchingScore === 'number' && (
                              <ScoreBadge score={Math.round(app.matchingScore)} size="sm" />
                            )}
                          </div>

                          {/* Schedule Interview Button if in INTERVIEW stage */}
                          {app.stage === 'INTERVIEW' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleModalApp({
                                  applicationId: app.id,
                                  candidateName: fullName,
                                  jobTitle: app.job?.title || '',
                                });
                              }}
                              className="w-full mb-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm"
                            >
                              <CalendarPlus className="h-3.5 w-3.5 text-amber-600" />
                              <span>Lên lịch phỏng vấn</span>
                            </button>
                          )}

                          {/* Action Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                            {/* Quick Stage Select for Accessibility/Alternative to Drag */}
                            <select
                              value={app.stage}
                              onChange={(e) => handleStageChange(app.id, e.target.value, app.stage)}
                              className="text-[11px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 focus:outline-none focus:border-blue-400 max-w-[120px]"
                              title="Chuyển giai đoạn nhanh"
                            >
                              {PIPELINE_COLUMNS.map((col) => (
                                <option key={col.key} value={col.key}>
                                  {col.label}
                                </option>
                              ))}
                            </select>

                            {/* View Candidate Button */}
                            {user?.id && (
                              <button
                                type="button"
                                onClick={() => navigate(`/recruiter/candidates/${user.id}`)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                                title="Xem chi tiết hồ sơ ứng viên"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Xem</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModalApp && (
        <ScheduleInterviewModal
          isOpen={Boolean(scheduleModalApp)}
          onClose={() => setScheduleModalApp(null)}
          applicationId={scheduleModalApp.applicationId}
          candidateName={scheduleModalApp.candidateName}
          jobTitle={scheduleModalApp.jobTitle}
          onSuccess={() => {
            setToast({
              message: `Đã tạo lịch phỏng vấn cho ${scheduleModalApp.candidateName}`,
              type: 'success',
            });
            setScheduleModalApp(null);
          }}
        />
      )}
    </div>
  );
}
