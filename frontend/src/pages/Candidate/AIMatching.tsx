import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  Send, 
  X, 
  UserCheck, 
  Briefcase
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';
import ScoreBadge from '../../components/ui/ScoreBadge';
import SkillTag from '../../components/ui/SkillTag';

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
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState<Recommendation['job'] | null>(null);
  const [applyResumeUrl, setApplyResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);

  const showToast = (text: string, success: boolean) => {
    setToast({ message: text, isSuccess: success });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRecommendations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingRecs(true);
      const response = await api.get('/job/recommendations?limit=10');
      setRecommendations(response.data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      if (showLoading) setLoadingRecs(false);
    }
  }, []);

  // Fetch initial profile & recommendations
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
        if (active) setLoadingRecs(false);
      });

    // Check if candidate already has a profile to populate parsed state
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
      setMessage('Hãy chọn file PDF hoặc DOCX trước.');
      setIsSuccess(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File CV không được vượt quá 5 MB.');
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
      setMessage('Đã đọc và phân tích CV thành công! Danh sách việc làm phù hợp đã được cập nhật.');
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
      showToast(`Ứng tuyển vị trí "${selectedJob.title}" thành công!`, true);
      setSelectedJob(null);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Alert */}
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

      {/* Hero Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-300 border border-indigo-400/20 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Career Matching & Recommendation
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold">Phân Tích CV & Gợi Ý Việc Làm Phù Hợp</h2>
              <p className="mt-1 max-w-xl text-xs sm:text-sm text-slate-300">
                Tải lên CV của bạn, AI sẽ tự động trích xuất kỹ năng, kinh nghiệm và đề xuất các vị trí công việc có độ tương thích cao nhất.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/candidate/profile')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition shrink-0"
          >
            <UserCheck className="h-4 w-4" />
            Chỉnh sửa Hồ sơ đầy đủ →
          </button>
        </div>
      </section>

      {/* CV Upload & Analysis Result Row */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Upload Card */}
        <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Tải File CV Mới</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ PDF, DOCX</span>
          </div>

          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition">
            <FileText className="h-8 w-8 text-indigo-600" />
            <span className="mt-3 text-xs font-bold text-slate-800">
              {file ? file.name : 'Chọn hoặc kéo thả file CV vào đây'}
            </span>
            <span className="mt-1 text-[11px] text-slate-400">Dung lượng tối đa 5 MB</span>
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                AI đang đọc và phân tích...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Đọc và Phân Tích với AI
              </>
            )}
          </button>

          {message && (
            <p className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium border ${
              isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {message}
            </p>
          )}
        </form>

        {/* Profile / Parsed Result Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Dữ Liệu Hồ Sơ Hiện Tại</h3>
            </div>
            {parsedResume ? (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                ✓ Đã đồng bộ AI
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">Chưa có dữ liệu</span>
            )}
          </div>

          {!parsedResume ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <FileText className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-xs">Hãy tải CV hoặc hoàn thiện hồ sơ để xem kết quả phân tích kỹ năng & kinh nghiệm.</p>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ứng viên</span>
                  <span className="font-bold text-slate-800">{parsedResume.fullName || 'Chưa xác định'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vị trí & Kinh nghiệm</span>
                  <span className="font-bold text-indigo-700">
                    {parsedResume.position || 'Chuyên viên'} · {parsedResume.experienceYears} năm KN
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Kỹ năng được nhận diện ({parsedResume.skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parsedResume.skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="default" />
                  ))}
                </div>
              </div>

              {parsedResume.summary && (
                <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Tóm tắt chuyên môn:</span>
                  {parsedResume.summary}
                </div>
              )}
            </div>
          )}
        </section>
      </section>

      {/* AI Recommendations List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Vị Trí Phù Hợp Được AI Đề Xuất</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách việc làm sắp xếp theo tỷ lệ tương thích (Matching Score) từ cao xuống thấp.
            </p>
          </div>

          <button
            onClick={() => loadRecommendations(true)}
            title="Làm mới danh sách gợi ý"
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRecs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingRecs ? (
          <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Đang tính toán điểm tương thích...</span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-slate-700">Chưa có gợi ý việc làm phù hợp</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hãy tải lên CV hoặc bổ sung kỹ năng trong hồ sơ cá nhân để nhận gợi ý chính xác.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recommendations.map(({ job, matching }) => {
              const isApplied = appliedJobIds.has(job.id);

              return (
                <article
                  key={job.id}
                  className="rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{job.title}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                          {job.company?.name || 'Doanh nghiệp'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        {job.salaryRange && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <DollarSign className="h-3.5 w-3.5" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <ScoreBadge score={matching.matchingScore} size="lg" label="Match" />
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          Kỹ năng {matching.skillScore}% · KN {matching.experienceScore}%
                        </span>
                      </div>

                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã nộp đơn
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(job)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                        >
                          <Send className="h-3.5 w-3.5" /> Ứng tuyển ngay
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Explanation Callout */}
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{matching.aiExplanation}</span>
                  </div>

                  {/* Requirements snippet if available */}
                  {job.requirements && (
                    <div className="text-[11px] text-slate-500">
                      <strong className="text-slate-700">Yêu cầu vị trí:</strong> {job.requirements}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Apply Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-1">
                <Send className="h-3 w-3" /> Nộp Đơn Ứng Tuyển
              </div>
              <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
              <p className="text-xs text-slate-500">{selectedJob.company?.name} · {selectedJob.location}</p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường dẫn CV ứng tuyển (URL trực tuyến)
                </label>
                <input
                  type="url"
                  value={applyResumeUrl}
                  onChange={(e) => setApplyResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nếu bạn đã tải CV lên hệ thống, AI sẽ tự động liên kết hồ sơ của bạn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thư giới thiệu (Cover Letter)
                </label>
                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu ngắn gọn lý do bạn phù hợp với vị trí này..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="w-1/3 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:bg-slate-300 transition"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang gửi đơn...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Xác Nhận Nộp Đơn
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
