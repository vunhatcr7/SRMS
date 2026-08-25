import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Sparkles, 
  Search, 
  FileText, 
  User, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Users
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials, getStageColor, formatDate } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';

interface Application {
  id: string;
  jobId: string;
  stage: string;
  createdAt: string;
  matchingScore: number;
  skillScore: number;
  experienceScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  aiExplanation?: string;
  recommendation?: string;
  job: {
    id?: string;
    title: string;
    location: string;
  };
  candidateProfile: {
    id: string;
    userId: string;
    resumeUrl?: string;
    resumeText?: string;
    user: {
      id?: string;
      fullName?: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
  };
}

const STAGES = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'APPLIED', label: '📥 Đã nộp đơn' },
  { value: 'SCREENING', label: '🔍 Lọc hồ sơ' },
  { value: 'INTERVIEW', label: '📅 Phỏng vấn' },
  { value: 'OFFER', label: '🎉 Gửi Offer' },
  { value: 'HIRED', label: '✅ Đã tuyển' },
  { value: 'REJECTED', label: '❌ Từ chối' },
];

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);

  const showToast = (message: string, isSuccess: boolean) => {
    setToast({ message, isSuccess });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApplications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/application/recruiter');
      if (Array.isArray(res.data)) {
        setApplications(
          [...res.data].sort((a, b) => (b.matchingScore ?? 0) - (a.matchingScore ?? 0))
        );
      }
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api.get('/application/recruiter')
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res.data)) {
          setApplications(
            [...res.data].sort((a, b) => (b.matchingScore ?? 0) - (a.matchingScore ?? 0))
          );
        }
      })
      .catch((err) => {
        if (active) showToast(getErrorMessage(err), false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Update Process Stage
  const handleStageChange = async (applicationId: string, newStage: string) => {
    setUpdatingId(applicationId);
    try {
      await api.put('/application/update-stage', { applicationId, stage: newStage });
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
      );
      showToast('Cập nhật trạng thái ứng tuyển thành công!', true);
    } catch (error) {
      showToast(getErrorMessage(error), false);
    } finally {
      setUpdatingId(null);
    }
  };

  // Trigger AI analysis on a single application
  const handleAnalyzeAI = async (applicationId: string) => {
    setAnalyzingId(applicationId);
    try {
      const res = await api.post(`/application/${applicationId}/analyze`);
      const updated = res.data.application;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                matchingScore: updated.matchingScore,
                skillScore: updated.skillScore,
                experienceScore: updated.experienceScore,
                matchedSkills: updated.matchedSkills,
                missingSkills: updated.missingSkills,
                aiExplanation: updated.aiExplanation,
                recommendation: updated.recommendation,
              }
            : app
        )
      );
      showToast('Đã phân tích hồ sơ bằng AI thành công!', true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Unique jobs for filtering
  const uniqueJobs = useMemo(() => {
    const jobMap = new Map<string, { id: string; title: string }>();
    applications.forEach((app) => {
      if (app.jobId && app.job?.title) {
        jobMap.set(app.jobId, { id: app.jobId, title: app.job.title });
      }
    });
    return Array.from(jobMap.values());
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesJob = selectedJob === 'ALL' || app.jobId === selectedJob;
      const matchesStage = selectedStage === 'ALL' || app.stage === selectedStage;
      const matchesSearch =
        searchQuery === '' ||
        (app.candidateProfile?.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.candidateProfile?.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.job?.title || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesJob && matchesStage && matchesSearch;
    });
  }, [applications, selectedJob, selectedStage, searchQuery]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const avgScore =
      total > 0
        ? Math.round(applications.reduce((acc, curr) => acc + (curr.matchingScore || 0), 0) / total)
        : 0;
    const interviewing = applications.filter((a) => a.stage === 'INTERVIEW').length;
    const hired = applications.filter((a) => a.stage === 'HIRED').length;
    return { total, avgScore, interviewing, hired };
  }, [applications]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            toast.isSuccess
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <BarChart3 className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Recruitment Dashboard
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">Quản Lý Tuyển Dụng & Sàng Lọc AI</h2>
            <p className="text-xs text-slate-300 mt-1">
              Theo dõi toàn bộ hồ sơ ứng tuyển, điểm AI matching và chuyển đổi trạng thái ứng viên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchApplications(true)}
              title="Làm mới danh sách"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/job/create')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition shrink-0"
            >
              <Briefcase className="h-4 w-4" /> Đăng Tin Tuyển Dụng Mới
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold block">Tổng đơn ứng tuyển</span>
            <span className="text-xl font-black text-white">{metrics.total}</span>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold block">Điểm AI Matching TB</span>
            <span className="text-xl font-black text-indigo-300">{metrics.avgScore}%</span>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold block">Đang phỏng vấn</span>
            <span className="text-xl font-black text-amber-300">{metrics.interviewing}</span>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold block">Đã tuyển dụng</span>
            <span className="text-xl font-black text-emerald-400">{metrics.hired}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ứng viên, email hoặc vị trí..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
            >
              <option value="ALL">Tất cả vị trí tuyển dụng ({uniqueJobs.length})</option>
              {uniqueJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Job Quick Action: View AI Ranking */}
        {selectedJob !== 'ALL' && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Đang lọc theo vị trí: <strong className="text-slate-800">{uniqueJobs.find((j) => j.id === selectedJob)?.title}</strong>
            </span>
            <button
              onClick={() => navigate(`/dashboard/ranking/${selectedJob}`)}
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Xem bảng xếp hạng AI vị trí này →
            </button>
          </div>
        )}
      </section>

      {/* Applications Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Đang tải danh sách hồ sơ ứng tuyển...</span>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ nào</h3>
          <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                  <th className="p-4">Ứng viên</th>
                  <th className="p-4">Vị trí ứng tuyển</th>
                  <th className="p-4">Ngày nộp</th>
                  <th className="p-4 text-center">Điểm AI</th>
                  <th className="p-4">Trạng thái xử lý</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredApplications.map((app) => {
                  const candidateUser = app.candidateProfile?.user;
                  const isUpdating = updatingId === app.id;
                  const isAnalyzing = analyzingId === app.id;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition">
                      {/* Candidate info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {getInitials(candidateUser?.fullName)}
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                if (candidateUser?.id || app.candidateProfile?.userId) {
                                  navigate(`/candidate/detail/${candidateUser?.id || app.candidateProfile?.userId}`);
                                }
                              }}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left transition"
                            >
                              {candidateUser?.fullName || 'Chưa cập nhật'}
                            </button>
                            <div className="text-[11px] text-slate-400">{candidateUser?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="p-4">
                        <div className="font-semibold text-indigo-700">{app.job?.title}</div>
                        <div className="text-[11px] text-slate-400">📍 {app.job?.location}</div>
                        {app.jobId && (
                          <button
                            onClick={() => navigate(`/dashboard/ranking/${app.jobId}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 mt-1 transition"
                          >
                            <Sparkles className="h-3 w-3" />
                            Xếp hạng vị trí này
                          </button>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500">
                        {formatDate(app.createdAt)}
                      </td>

                      {/* AI Matching Score */}
                      <td className="p-4 text-center">
                        <ScoreBadge score={Math.round(app.matchingScore || 0)} size="md" />
                        <span className="block text-[10px] text-slate-400 font-medium mt-1">
                          KN {Math.round(app.skillScore || 0)}% · EXP {Math.round(app.experienceScore || 0)}%
                        </span>
                      </td>

                      {/* Stage Selector */}
                      <td className="p-4">
                        <select
                          disabled={isUpdating}
                          value={app.stage}
                          onChange={(e) => handleStageChange(app.id, e.target.value)}
                          className={`p-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer shadow-sm transition min-w-[130px] ${getStageColor(
                            app.stage
                          )} disabled:opacity-50`}
                        >
                          {STAGES.filter((s) => s.value !== 'ALL').map((stg) => (
                            <option key={stg.value} value={stg.value} className="bg-white text-slate-800 font-normal">
                              {stg.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* AI Analyze Button */}
                          <button
                            disabled={isAnalyzing}
                            onClick={() => handleAnalyzeAI(app.id)}
                            title="Phân tích CV ứng viên so với JD"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                          >
                            {isAnalyzing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </button>

                          {/* View Resume Button */}
                          {app.candidateProfile?.resumeUrl && (
                            <a
                              href={app.candidateProfile.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Xem bản CV gốc"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}

                          {/* View Detail Link */}
                          <button
                            onClick={() => {
                              const targetId = candidateUser?.id || app.candidateProfile?.userId;
                              if (targetId) navigate(`/candidate/detail/${targetId}`);
                            }}
                            title="Xem chi tiết hồ sơ"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}