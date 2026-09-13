import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  User,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
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
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AIRanking() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobSummary | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!jobId) return;
    let active = true;

    api.get(`/application/ranking/${jobId}`)
      .then((res) => {
        if (!active) return;
        setJob(res.data.job);
        setCandidates(Array.isArray(res.data.applications) ? res.data.applications : []);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const showToast = (text: string, isSuccess: boolean) => {
    setToastMessage({ text, isSuccess });
    setTimeout(() => setToastMessage(null), 4000);
  };

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
      showToast('Analysis completed successfully.', true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleStageChange = async (applicationId: string, newStage: string) => {
    try {
      setUpdatingStageId(applicationId);
      await api.put('/application/update-stage', { applicationId, stage: newStage });
      setCandidates((prev) =>
        prev.map((c) => (c.id === applicationId ? { ...c, stage: newStage } : c))
      );
      showToast('Stage updated successfully.', true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setUpdatingStageId(null);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-amber-500 text-amber-950 font-black text-sm shadow-sm">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-300 text-slate-800 font-black text-sm shadow-sm">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-amber-600 text-amber-50 font-black text-sm shadow-sm">
          3
        </span>
      );
    }
    return (
      <span className={`flex h-7 w-7 items-center justify-center rounded font-bold text-xs ${isDark ? 'bg-navy-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
        #{rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-brand" />
          <span className="text-sm font-medium">Loading ranking...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 rounded-lg border border-rose-500/30 bg-rose-500/10 text-center">
        <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 mb-1">Unable to load ranking</h3>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/recruiter')}
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-card text-xs font-semibold transition-all ${
            toastMessage.isSuccess
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toastMessage.isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toastMessage.text}
        </div>
      )}

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/recruiter')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-muted border border-brand/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-light">
                AI Candidate Ranking
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-100">{job?.title || 'Job position'}</h2>
            <p className="mt-1 text-xs text-slate-400">
              Candidates ranked by AI match score.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-navy-700 bg-navy-850 p-4 shrink-0">
            <div className="text-center">
              <span className="block text-2xl font-black text-slate-100">{candidates.length}</span>
              <span className="text-[11px] text-slate-500 font-medium uppercase">Candidates</span>
            </div>
            <div className="h-8 w-px bg-navy-700" />
            <div className="text-center">
              <span className="block text-2xl font-black text-brand-light">
                {candidates.length > 0 ? `${Math.round(candidates[0].matchingScore)}%` : '0%'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium uppercase">Top match</span>
            </div>
          </div>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <User className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No applications yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            When candidates apply, AI will automatically rank them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const user = candidate.candidateProfile?.user;
            const isAnalyzing = analyzingId === candidate.id;
            const isUpdating = updatingStageId === candidate.id;

            return (
              <article
                key={candidate.id}
                className={`rounded-lg border p-4 transition ${isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700">
                  <div className="flex items-center gap-3.5">
                    {getRankBadge(candidate.rank)}

                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                      {getInitials(user?.fullName)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-sm">
                          {user?.fullName || 'Not provided'}
                        </h3>
                        {candidate.recommendation && (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {candidate.recommendation}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {user?.email} {user?.phone && `· ${user.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="text-right">
                      <ScoreBadge score={Math.round(candidate.matchingScore)} size="md" label="Match" />
                      <span className={`block text-[10px] font-semibold mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Skills {Math.round(candidate.skillScore)}% · Exp {Math.round(candidate.experienceScore)}%
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        disabled={isUpdating}
                        value={candidate.stage}
                        onChange={(e) => handleStageChange(candidate.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded border outline-none cursor-pointer transition shadow-sm ${getStageColor(
                          candidate.stage
                        )} disabled:opacity-50`}
                      >
                        {STAGES.map((stg) => (
                          <option key={stg.value} value={stg.value} className={isDark ? 'bg-navy-800 text-slate-200' : 'bg-white text-slate-800'}>
                            {stg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  {candidate.aiExplanation && (
                    <div className={`rounded-lg border p-3 ${isDark ? 'bg-navy-850 border-navy-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className="font-bold text-brand-light mr-1.5">AI:</span>
                      {candidate.aiExplanation}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-emerald-400">Matched:</span>
                        {candidate.matchedSkills.map((s) => (
                          <SkillTag key={s} skill={s} variant="matched" />
                        ))}
                      </div>
                    )}

                    {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-3">
                        <span className="text-[11px] font-semibold text-rose-400">Missing:</span>
                        {candidate.missingSkills.map((s) => (
                          <SkillTag key={s} skill={s} variant="missing" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-navy-700 text-xs">
                  <div className="flex items-center gap-3">
                    {candidate.candidateProfile?.resumeUrl && (
                      <a
                        href={candidate.candidateProfile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-brand transition"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Resume
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}

                    <button
                      onClick={() => navigate(`/candidate/detail/${user?.id}`)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-brand transition"
                    >
                      <User className="h-3.5 w-3.5" />
                      Full profile
                    </button>
                  </div>

                  <button
                    disabled={isAnalyzing}
                    onClick={() => handleAnalyzeWithAI(candidate.id)}
                    className="inline-flex items-center gap-1.5 rounded border border-brand/30 bg-brand-muted px-3 py-1.5 font-bold text-brand-light hover:bg-brand-muted disabled:opacity-50 transition"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-analyze
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

