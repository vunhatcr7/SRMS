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
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { formatDate, getErrorMessage, getInitials, getStageLabel } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';
import ScheduleInterviewModal from '../../components/ScheduleInterviewModal';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

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
  { key: 'APPLIED', label: 'Applied', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30', borderColor: 'border-sky-500/30' },
  { key: 'SCREENING', label: 'Screening', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', borderColor: 'border-indigo-500/30' },
  { key: 'INTERVIEW', label: 'Interview', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', borderColor: 'border-amber-500/30' },
  { key: 'OFFER', label: 'Offer', color: 'text-pink-400', badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30', borderColor: 'border-pink-500/30' },
  { key: 'HIRED', label: 'Hired', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', borderColor: 'border-emerald-500/30' },
  { key: 'REJECTED', label: 'Rejected', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', borderColor: 'border-rose-500/30' },
];

export default function RecruiterPipeline() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [scheduleModalApp, setScheduleModalApp] = useState<{
    applicationId: string;
    candidateName: string;
    jobTitle: string;
  } | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

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
          setError(getErrorMessage(err) || 'Unable to load pipeline.');
        }
      })
      .finally(() => {
        if (active) {
          setDataLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    api.get('/application/recruiter')
      .then((res) => {
        setApplications(Array.isArray(res.data) ? res.data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err) || 'Unable to load pipeline.');
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  const jobs = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    applications.forEach((app) => {
      if (app.job?.id) {
        map.set(app.job.id, { id: app.job.id, title: app.job.title });
      }
    });
    return Array.from(map.values());
  }, [applications]);

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

  const handleStageChange = async (applicationId: string, newStage: string, prevStage: string) => {
    if (newStage === prevStage) return;

    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
    );

    try {
      const res = await api.put('/application/update-stage', {
        applicationId,
        stage: newStage,
      });

      if (res.data?.application) {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, ...res.data.application } : app))
        );
      }

      setToast({
        message: `Moved candidate to "${getStageLabel(newStage)}"`,
        type: 'success',
      });
    } catch (err: unknown) {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, stage: prevStage } : app))
      );
      setToast({
        message: getErrorMessage(err) || 'Failed to update stage. Reverted.',
        type: 'error',
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className={`rounded-lg border p-3.5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={`rounded-lg border p-3 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-card transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand bg-brand-muted px-2.5 py-0.5 rounded border border-brand/20">
              Recruiter Pipeline
            </span>
            <span className="text-xs text-slate-500">
              {filteredApplications.length} candidates
            </span>
          </div>
          <h1 className={`mt-1 text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Recruitment pipeline
          </h1>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Drag and drop cards between columns to update hiring progress in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className={`inline-flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
              isDark
                ? 'border-navy-700 bg-navy-800 text-slate-300 hover:border-navy-600 hover:text-slate-100'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
            }`}
            title="Refresh data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className={`rounded-lg border p-3.5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, position..."
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
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-w-[1200px] w-full items-start">
          {PIPELINE_COLUMNS.map((column) => {
            const columnApps = groupedByStage[column.key] || [];
            const isTargetOver = dragOverColumn === column.key;

            return (
              <div
                key={column.key}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDragLeave={(e) => handleDragLeave(e, column.key)}
                onDrop={(e) => handleDrop(e, column.key)}
                className={`flex flex-col w-[260px] shrink-0 rounded-lg border transition-all duration-150 ${
                  isTargetOver
                    ? 'border-brand bg-brand-muted shadow-card'
                    : isDark
                      ? 'border-navy-700 bg-navy-800'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                 <div className="flex items-center justify-between px-3 py-2.5 border-b border-navy-700 bg-navy-900/50 rounded-t-lg">
                   <div className="flex items-center gap-2">
                     <span className={`h-2 w-2 rounded-full ${
                       column.key === 'APPLIED' ? 'bg-sky-500' :
                       column.key === 'SCREENING' ? 'bg-indigo-500' :
                       column.key === 'INTERVIEW' ? 'bg-amber-500' :
                       column.key === 'OFFER' ? 'bg-pink-500' :
                       column.key === 'HIRED' ? 'bg-emerald-500' : 'bg-rose-500'
                     }`} />
                     <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                       {column.label}
                     </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${column.badgeBg}`}>
                    {columnApps.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 p-2.5 min-h-[400px] max-h-[calc(100vh-240px)] overflow-y-auto">
                  {columnApps.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-24 rounded-lg border border-dashed text-center p-3 ${isDark ? 'border-navy-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                      <p className="text-xs">No candidates</p>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Drag cards here</p>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const candidate = app.candidateProfile;
                      const user = candidate?.user;
                      const fullName = user?.fullName || 'Unnamed candidate';
                      const position = candidate?.experience?.position || user?.email || 'Candidate';
                      const isBeingDragged = draggedAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id, app.stage)}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-lg border p-3 transition-all cursor-grab active:cursor-grabbing ${
                            isBeingDragged ? 'opacity-40 scale-[0.98] border-dashed border-brand' : ''
                          } ${isDark ? 'border-navy-700 bg-navy-850 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`grid h-7 w-7 place-items-center rounded text-[11px] font-bold ${isDark ? 'bg-navy-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                {getInitials(fullName)}
                              </div>
                              <div className="min-w-0">
                                <h4 className={`truncate text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={fullName}>
                                  {fullName}
                                </h4>
                                <p className="truncate text-[11px] text-slate-500" title={position}>
                                  {position}
                                </p>
                              </div>
                            </div>
                            <GripVertical className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] mb-2.5 text-slate-500">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate" title={app.job?.title}>
                              {app.job?.title || 'Job'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] mb-2.5">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(app.createdAt)}</span>
                            </div>
                            {typeof app.matchingScore === 'number' && (
                              <ScoreBadge score={Math.round(app.matchingScore)} size="sm" />
                            )}
                          </div>

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
                              className="w-full mb-2 inline-flex items-center justify-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 py-1.5 text-[11px] font-bold text-amber-400 transition hover:bg-amber-500/20"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                              Schedule interview
                            </button>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-navy-700 gap-2">
                            <select
                              value={app.stage}
                              onChange={(e) => handleStageChange(app.id, e.target.value, app.stage)}
                              className={`text-[11px] rounded border px-2 py-1 outline-none focus:border-brand max-w-[120px] ${isDark ? 'border-navy-700 bg-navy-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}
                              title="Quick stage update"
                            >
                              {PIPELINE_COLUMNS.map((col) => (
                                <option key={col.key} value={col.key}>
                                  {col.label}
                                </option>
                              ))}
                            </select>

                            {user?.id && (
                              <button
                                type="button"
                                onClick={() => navigate(`/recruiter/candidates/${user.id}`)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-light transition"
                                title="View candidate profile"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View</span>
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

      {scheduleModalApp && (
        <ScheduleInterviewModal
          isOpen={Boolean(scheduleModalApp)}
          onClose={() => setScheduleModalApp(null)}
          applicationId={scheduleModalApp.applicationId}
          candidateName={scheduleModalApp.candidateName}
          jobTitle={scheduleModalApp.jobTitle}
          onSuccess={() => {
            setToast({
              message: `Interview scheduled for ${scheduleModalApp.candidateName}`,
              type: 'success',
            });
            setScheduleModalApp(null);
          }}
        />
      )}
    </div>
  );
}
