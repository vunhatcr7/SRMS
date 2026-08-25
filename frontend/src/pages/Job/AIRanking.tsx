import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials, getStageColor } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';
import SkillTag from '../../components/ui/SkillTag';

interface JobSummary {
  id: string;
  title: string;
  recruiterId: string;
}

interface RankedCandidate {
  rank: number;
  id: string;
  jobId: string;
  stage: string;
  matchingScore: number;
  skillScore: number;
  experienceScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  aiExplanation?: string;
  recommendation?: string;
  createdAt: string;
  candidateProfile: {
    id: string;
    userId: string;
    resumeUrl?: string;
    resumeText?: string;
    skills: string[];
    experience?: {
      years?: number;
      position?: string;
    };
    user: {
      id: string;
      fullName?: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
  };
}

const STAGES = [
  { value: 'APPLIED', label: '📥 Đã nộp đơn' },
  { value: 'SCREENING', label: '🔍 Lọc hồ sơ' },
  { value: 'INTERVIEW', label: '📅 Phỏng vấn' },
  { value: 'OFFER', label: '🎉 Gửi Offer' },
  { value: 'HIRED', label: '✅ Đã tuyển' },
  { value: 'REJECTED', label: '❌ Từ chối' },
];

export default function AIRanking() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobSummary | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Per-candidate actions loading state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const fetchRankings = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/application/ranking/${jobId}`);
      setJob(res.data.job);
      setCandidates(Array.isArray(res.data.applications) ? res.data.applications : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const showToast = (text: string, isSuccess: boolean) => {
    setToastMessage({ text, isSuccess });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Trigger AI analysis for a specific application
  const handleAnalyzeWithAI = async (applicationId: string) => {
    try {
      setAnalyzingId(applicationId);
      const res = await api.post(`/application/${applicationId}/analyze`);
      const updatedApp = res.data.application;

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === applicationId
            ? {
                ...c,
                matchingScore: updatedApp.matchingScore,
                skillScore: updatedApp.skillScore,
                experienceScore: updatedApp.experienceScore,
                matchedSkills: updatedApp.matchedSkills,
                missingSkills: updatedApp.missingSkills,
                aiExplanation: updatedApp.aiExplanation,
                recommendation: updatedApp.recommendation,
              }
            : c
        )
      );
      showToast('Đã phân tích hồ sơ ứng viên bằng AI thành công!', true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Update application recruitment stage
  const handleStageChange = async (applicationId: string, newStage: string) => {
    try {
      setUpdatingStageId(applicationId);
      await api.put('/application/update-stage', { applicationId, stage: newStage });
      setCandidates((prev) =>
        prev.map((c) => (c.id === applicationId ? { ...c, stage: newStage } : c))
      );
      showToast('Đã cập nhật trạng thái ứng tuyển!', true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setUpdatingStageId(null);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-md ring-2 ring-amber-300">
          🥇1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-slate-200">
          🥈2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-600 text-amber-50 font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-amber-500">
          🥉3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
        #{rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Đang tải bảng xếp hạng AI...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Không thể tải bảng xếp hạng</h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard/recruiter')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            toastMessage.isSuccess
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toastMessage.text}
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard/recruiter')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Dashboard
            </button>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Candidate Ranking
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-1">{job?.title || 'Vị trí tuyển dụng'}</h2>
            <p className="text-xs text-slate-300 mt-1">
              Ứng viên được AI tự động phân tích và sắp xếp theo độ tương thích với yêu cầu công việc.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
            <div className="text-center">
              <span className="block text-2xl font-black text-white">{candidates.length}</span>
              <span className="text-[11px] text-slate-400 font-medium uppercase">Ứng viên</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <span className="block text-2xl font-black text-indigo-300">
                {candidates.length > 0 ? `${Math.round(candidates[0].matchingScore)}%` : '0%'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium uppercase">Top Match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Ranking List */}
      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có hồ sơ ứng tuyển nào</h3>
          <p className="text-xs text-slate-500 mt-1">
            Khi ứng viên nộp hồ sơ, AI sẽ tự động phân tích và hiển thị bảng xếp hạng tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => {
            const user = candidate.candidateProfile?.user;
            const isAnalyzing = analyzingId === candidate.id;
            const isUpdating = updatingStageId === candidate.id;

            return (
              <article
                key={candidate.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition space-y-4"
              >
                {/* Row 1: Rank, Candidate Info, Scores, and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    {getRankBadge(candidate.rank)}
                    
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {getInitials(user?.fullName)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {user?.fullName || 'Chưa cập nhật tên'}
                        </h3>
                        {candidate.recommendation && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            {candidate.recommendation}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user?.email} {user?.phone && `· ${user.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Scores + Stage Selector */}
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {/* Score Badges */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <ScoreBadge score={Math.round(candidate.matchingScore)} size="lg" label="Matching" />
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          Kỹ năng {Math.round(candidate.skillScore)}% · KN {Math.round(candidate.experienceScore)}%
                        </span>
                      </div>
                    </div>

                    {/* Stage Dropdown */}
                    <div className="relative">
                      <select
                        disabled={isUpdating}
                        value={candidate.stage}
                        onChange={(e) => handleStageChange(candidate.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition shadow-sm ${getStageColor(
                          candidate.stage
                        )} disabled:opacity-50`}
                      >
                        {STAGES.map((stg) => (
                          <option key={stg.value} value={stg.value} className="bg-white text-slate-800 font-normal">
                            {stg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 2: AI Explanation & Skills breakdown */}
                <div className="space-y-2 text-xs">
                  {candidate.aiExplanation && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-700">
                      <span className="font-bold text-indigo-700 mr-1.5">💡 AI Đánh giá:</span>
                      {candidate.aiExplanation}
                    </div>
                  )}

                  {/* Matched & Missing Skills tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700">Kỹ năng khớp:</span>
                        {candidate.matchedSkills.map((s) => (
                          <SkillTag key={s} skill={s} variant="matched" />
                        ))}
                      </div>
                    )}

                    {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-3">
                        <span className="text-[11px] font-semibold text-rose-600">Còn thiếu:</span>
                        {candidate.missingSkills.map((s) => (
                          <SkillTag key={s} skill={s} variant="missing" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    {candidate.candidateProfile?.resumeUrl && (
                      <a
                        href={candidate.candidateProfile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-semibold p-1 transition"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        File CV
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}

                    <button
                      onClick={() => navigate(`/candidate/detail/${user?.id}`)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-semibold p-1 transition ml-2"
                    >
                      <User className="h-3.5 w-3.5" />
                      Xem toàn bộ hồ sơ
                    </button>
                  </div>

                  <button
                    disabled={isAnalyzing}
                    onClick={() => handleAnalyzeWithAI(candidate.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        Phân tích lại với AI
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
