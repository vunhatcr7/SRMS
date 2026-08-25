import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Plus, 
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials } from '../../utils/formatters';

interface ExperienceData {
  years?: number;
  position?: string;
  summary?: string;
}

interface EducationData {
  school?: string;
  major?: string;
  summary?: string;
}

interface ProfileUser {
  fullName?: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface CandidateProfileResponse {
  id: string;
  userId: string;
  skills: string[];
  experience: ExperienceData | null;
  education: EducationData | null;
  resumeUrl?: string | null;
  resumeText?: string | null;
  user: ProfileUser;
}

export default function CandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [position, setPosition] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [educationSummary, setEducationSummary] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // CV Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploadMessage, setCvUploadMessage] = useState('');
  const [cvSuccess, setCvSuccess] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidate/profile');
      const data: CandidateProfileResponse = res.data;
      setProfile(data);

      setSkills(Array.isArray(data.skills) ? data.skills : []);
      if (data.experience && typeof data.experience === 'object') {
        setExperienceYears(data.experience.years ?? 0);
        setPosition(data.experience.position ?? '');
        setExperienceSummary(data.experience.summary ?? '');
      }
      if (data.education && typeof data.education === 'object') {
        setEducationSummary(data.education.summary || `${data.education.school || ''} ${data.education.major || ''}`.trim());
      }
      setResumeUrl(data.resumeUrl || '');
    } catch {
      // Profile not created yet
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const payload = {
        skills,
        experience: {
          years: Number(experienceYears) || 0,
          position: position.trim(),
          summary: experienceSummary.trim(),
        },
        education: {
          summary: educationSummary.trim(),
        },
        resumeUrl: resumeUrl.trim() || undefined,
      };

      const res = await api.put('/candidate/profile', payload);
      setIsSuccess(true);
      setMessage(res.data?.message || 'Cập nhật hồ sơ ứng viên thành công!');
      await fetchProfile();
    } catch (err) {
      setIsSuccess(false);
      setMessage(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAndParseCV = async () => {
    if (!cvFile) {
      setCvUploadMessage('Vui lòng chọn file CV (PDF hoặc DOCX).');
      setCvSuccess(false);
      return;
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      setCvUploadMessage('File không được vượt quá 5MB.');
      setCvSuccess(false);
      return;
    }

    setParsing(true);
    setCvUploadMessage('');
    setCvSuccess(false);

    try {
      // 1. Upload CV file
      const formData = new FormData();
      formData.append('resume', cvFile);
      await api.post('/candidate/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. Trigger AI Parse
      const parseRes = await api.post('/candidate/resume/parse');
      const parsed = parseRes.data?.parsedResume;

      setCvSuccess(true);
      setCvUploadMessage('AI đã trích xuất và cập nhật dữ liệu hồ sơ thành công!');
      
      // Update form directly with parsed result
      if (parsed) {
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
        if (typeof parsed.experienceYears === 'number') setExperienceYears(parsed.experienceYears);
        if (parsed.position) setPosition(parsed.position);
        if (parsed.summary) setExperienceSummary(parsed.summary);
        if (parsed.education) setEducationSummary(parsed.education);
      }

      await fetchProfile();
      setCvFile(null);
    } catch (err) {
      setCvSuccess(false);
      setCvUploadMessage(getErrorMessage(err));
    } finally {
      setParsing(false);
    }
  };

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = profile?.user || storedUser || {
    fullName: 'Ứng viên',
    email: 'candidate@srms.com',
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Đang tải hồ sơ ứng viên...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-indigo-300/30 shrink-0">
              {getInitials(currentUser.fullName)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-1 border border-indigo-400/20">
                <User className="h-3 w-3" />
                Hồ Sơ Ứng Viên
              </div>
              <h2 className="text-2xl font-bold">{currentUser.fullName || 'Chưa cập nhật tên'}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  {currentUser.email}
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                    {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs">
            <span className="text-slate-400">Trạng thái CV:</span>
            {profile?.resumeText ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <FileCheck className="h-4 w-4" /> Đã có CV trong hệ thống
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                <AlertCircle className="h-4 w-4" /> Chưa tải CV
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI CV Fast Upload Card */}
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-indigo-100/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Trích Xuất & Điền Hồ Sơ Tự Động</h3>
              <p className="text-xs text-slate-500">Tải lên file CV (PDF/DOCX), AI sẽ tự động đọc kỹ năng và kinh nghiệm vào form bên dưới.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full flex items-center justify-between rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/60 transition">
            <div className="flex items-center gap-3 truncate">
              <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {cvFile ? cvFile.name : 'Chọn file CV từ máy tính (.pdf, .docx - max 5MB)'}
              </span>
            </div>
            <span className="shrink-0 text-xs font-bold text-indigo-600 ml-2">Duyệt file</span>
            <input 
              type="file" 
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              className="hidden" 
              onChange={(e) => setCvFile(e.target.files?.[0] || null)} 
            />
          </label>

          <button
            type="button"
            disabled={!cvFile || parsing}
            onClick={handleUploadAndParseCV}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
          >
            {parsing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                AI đang đọc CV...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Trích xuất với AI
              </>
            )}
          </button>
        </div>

        {cvUploadMessage && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
            cvSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {cvSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {cvUploadMessage}
          </div>
        )}
      </section>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Chi Tiết Hồ Sơ Tuyển Dụng</h3>
            <p className="text-xs text-slate-500">Thông tin này được AI sử dụng để xếp hạng và gợi ý công việc phù hợp.</p>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium ${
            isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {message}
          </div>
        )}

        {/* 1. Kỹ năng (Skills Tags) */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Danh sách kỹ năng chuyên môn (Skills)
          </label>
          <p className="text-xs text-slate-500 mb-2">Nhập tên kỹ năng (React, Node.js, SQL, Docker...) rồi bấm Enter hoặc nút Thêm.</p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDownSkill}
              placeholder="Nhập kỹ năng..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm
            </button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[42px] p-2.5 rounded-xl border border-slate-100 bg-slate-50/40">
            {skills.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Chưa có kỹ năng nào được thêm.</span>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-indigo-400 hover:text-rose-600 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 2. Kinh nghiệm (Experience) */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Briefcase className="h-4 w-4 text-indigo-600" />
            Kinh nghiệm làm việc
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số năm kinh nghiệm
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vị trí chuyên môn hiện tại / gần nhất
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ví dụ: Frontend Developer, Fullstack Engineer..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tóm tắt kinh nghiệm & dự án tiêu biểu
            </label>
            <textarea
              rows={3}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              placeholder="Mô tả các dự án đã làm, công nghệ sử dụng, trách nhiệm chính..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* 3. Học vấn (Education) */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Học vấn & Bằng cấp
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trường / Chuyên ngành / Bằng cấp
            </label>
            <input
              type="text"
              value={educationSummary}
              onChange={(e) => setEducationSummary(e.target.value)}
              placeholder="Ví dụ: Đại học Bách Khoa - Kỹ thuật phần mềm (2020 - 2024)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* 4. Link CV trực tuyến (Optional) */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Đường dẫn CV trực tuyến (Google Drive, Dropbox, Portfolio...)
          </label>
          <input
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* Submit action */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400 transition"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang lưu hồ sơ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu Thay Đổi Hồ Sơ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
