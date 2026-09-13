import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  RefreshCw,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';
import SkillTag from '../../components/ui/SkillTag';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface ParsedResume {
  fullName?: string;
  skills: string[];
  experienceYears: number;
  position?: string;
  education?: string;
  summary?: string;
}

interface Recommendation {
  job: {
    id: string;
    title: string;
    location: string;
    salaryRange?: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    company: { name: string };
  };
  matching: {
    matchingScore: number;
    skillScore: number;
    experienceScore: number;
    aiExplanation: string;
  };
}

export default function AIMatching() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Recommendation['job'] | null>(null);
  const [applyResumeUrl, setApplyResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isLoadingRecs = useMinimumLoading(recsLoaded, 1000);

  const showToast = (text: string, success: boolean) => {
    setToast({ message: text, isSuccess: success });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRecommendations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setRecsLoaded(false);
      const response = await api.get('/job/recommendations?limit=10');
      setRecommendations(response.data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      if (showLoading) setRecsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    api.get('/job/recommendations?limit=10')
      .then((response) => {
        if (active) setRecommendations(response.data.recommendations || []);
      })
      .catch(() => {
        if (active) setRecommendations([]);
      })
      .finally(() => {
        if (active) setRecsLoaded(true);
      });

    api.get('/candidate/profile')
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          setParsedResume({
            fullName: p.user?.fullName,
            skills: p.skills || [],
            experienceYears: p.experience?.years ?? 0,
            position: p.experience?.position,
            education: p.education?.summary,
            summary: p.experience?.summary,
          });
          if (p.resumeUrl) {
            setApplyResumeUrl(p.resumeUrl);
          }
        }
      })
      .catch(() => {
        // No profile yet
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a PDF or DOCX file.');
      setIsSuccess(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must not exceed 5 MB.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const response = await api.post('/candidate/resume/parse');
      setParsedResume(response.data.parsedResume);
      await loadRecommendations();
      setIsSuccess(true);
      setMessage('Resume analyzed successfully. Job recommendations updated.');
      setFile(null);
    } catch (error: unknown) {
      setIsSuccess(false);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplyModal = (job: Recommendation['job']) => {
    setSelectedJob(job);
    setCoverLetter('');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsApplying(true);
    try {
      await api.post('/application/apply', {
        jobId: selectedJob.id,
        resumeUrl: applyResumeUrl.trim() || undefined,
        coverLetter: coverLetter.trim() || undefined,
      });

      setAppliedJobIds((prev) => new Set(prev).add(selectedJob.id));
      showToast(`Applied to "${selectedJob.title}" successfully!`, true);
      setSelectedJob(null);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-card text-xs font-semibold transition-all ${
            toast.isSuccess
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toast.isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <section className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-brand-muted border-brand/20 text-brand-light' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-brand-light' : 'text-brand'}`}>
                AI Resume Analysis
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-100">Resume analysis & job recommendations</h2>
              <p className="mt-1 text-xs text-slate-400 max-w-xl">
                Upload your resume and we will extract skills, experience, and suggest matching roles.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/candidate/profile')}
            className="inline-flex items-center gap-1.5 rounded border border-navy-700 bg-navy-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-navy-600 hover:text-slate-100 shrink-0"
          >
            <UserCheck className="h-4 w-4" />
            Edit profile
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleAnalyze} className={`rounded-lg border p-5 space-y-4 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-brand" />
              <h3 className="text-base font-bold text-slate-100">Upload resume</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">PDF, DOCX</span>
          </div>

          <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-navy-700 bg-navy-850 px-5 py-8 text-center hover:border-brand transition">
            <FileText className="h-8 w-8 text-brand" />
            <span className="mt-3 text-xs font-bold text-slate-200">
              {file ? file.name : 'Select or drop resume file here'}
            </span>
            <span className="mt-1 text-[11px] text-slate-500">Max 5 MB</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !file}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Analyze resume
              </>
            )}
          </button>

          {message && (
            <p className={`flex items-start gap-2 rounded-lg p-3 text-xs font-medium border ${
              isSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}>
              {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {message}
            </p>
          )}
        </form>

        <section className={`rounded-lg border p-5 space-y-4 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Current profile data</h3>
            </div>
            {parsedResume ? (
              <span className={`rounded border px-2.5 py-0.5 text-[11px] font-bold ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                Synced
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">No data</span>
            )}
          </div>

          {!parsedResume ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <FileText className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-xs">Upload a resume or complete your profile to see skill analysis.</p>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-navy-700 bg-navy-850">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Candidate</span>
                  <span className="font-bold text-slate-200">{parsedResume.fullName || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Position & Experience</span>
                  <span className="font-bold text-brand-light">
                    {parsedResume.position || 'Professional'} · {parsedResume.experienceYears} years
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Identified skills ({parsedResume.skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parsedResume.skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="default" />
                  ))}
                </div>
              </div>

              {parsedResume.summary && (
                <div className={`rounded-lg border p-3 text-[11px] leading-relaxed ${isDark ? 'bg-navy-850 border-navy-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="font-bold text-slate-300 block mb-0.5">Summary:</span>
                  {parsedResume.summary}
                </div>
              )}
            </div>
          )}
        </section>
      </section>

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between border-b border-navy-700 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand" />
              <h3 className="text-base font-bold text-slate-100">Recommended jobs</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sorted by matching score from high to low.
            </p>
          </div>

          <button
            onClick={() => loadRecommendations()}
            className={`p-2 rounded border transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'}`}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingRecs ? 'animate-spin text-brand' : ''}`} />
          </button>
        </div>

        {isLoadingRecs ? (
          <div className="py-12 space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className={`rounded-lg border p-4 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-10 w-28" />
                </div>
                <div className={`mt-3 rounded-lg border p-3 ${isDark ? 'bg-navy-850 border-navy-700' : 'bg-slate-50 border-slate-200'}`}>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className={`rounded-lg border border-dashed p-8 text-center ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-40" />
            <p className="text-xs font-semibold text-slate-300">No matching jobs found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Upload a resume or add skills to your profile for better recommendations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recommendations.map(({ job, matching }) => {
              const isApplied = appliedJobIds.has(job.id);

              return (
                <article
                  key={job.id}
                  className={`rounded-lg border p-4 transition ${isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{job.title}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-brand" />
                          {job.company?.name || 'Company'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        {job.salaryRange && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            {job.salaryRange}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <ScoreBadge score={matching.matchingScore} size="md" label="Match" />
                        <span className={`block text-[10px] font-semibold mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Skills {matching.skillScore}% · Exp {matching.experienceScore}%
                        </span>
                      </div>

                      {isApplied ? (
                        <span className={`inline-flex items-center gap-1 rounded border px-3 py-2 text-xs font-bold ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(job)}
                          className="inline-flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
                        >
                          <Send className="h-3.5 w-3.5" /> Apply now
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`mt-3 rounded-lg border p-3 text-xs flex items-start gap-2 ${isDark ? 'bg-navy-850 border-navy-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <RefreshCw className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                    <span>{matching.aiExplanation}</span>
                  </div>

                  {job.requirements && (
                    <div className={`mt-2 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      <strong className="text-slate-300">Requirements:</strong> {job.requirements}
                    </div>
                  )}
                  {job.benefits && (
                    <div className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      <strong className="text-slate-300">Benefits:</strong> {job.benefits}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4">
          <div className={`relative w-full max-w-lg rounded-lg border p-6 shadow-card ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
            <button
              onClick={() => setSelectedJob(null)}
              className={`absolute right-4 top-4 transition ${isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-[11px] font-bold mb-1 ${isDark ? 'border-brand/30 bg-brand-muted text-brand-light' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                <Send className="h-3 w-3" /> Apply
              </div>
              <h3 className="text-lg font-bold text-slate-100">{selectedJob.title}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{selectedJob.company?.name} · {selectedJob.location}</p>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Resume URL</label>
                <input
                  type="url"
                  value={applyResumeUrl}
                  onChange={(e) => setApplyResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  If you already uploaded a resume, it will be linked automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cover letter</label>
                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Briefly explain why you are a good fit..."
                  className={`w-full resize-none rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className={`w-1/3 rounded border px-4 py-2.5 text-xs font-semibold transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-2/3 inline-flex items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Confirm application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

