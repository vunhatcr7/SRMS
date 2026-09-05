import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileCheck,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials } from '../../utils/formatters';
interface ExperienceData { years?: number; position?: string; summary?: string; }
interface EducationData { school?: string; major?: string; summary?: string; }
interface ProfileUser { fullName?: string; email: string; phone?: string; avatar?: string; }
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
interface ParsedResume {
  fullName?: string;
  email?: string;
  skills: string[];
  experienceYears: number;
  position?: string;
  education?: string;
  summary?: string;
}
interface ResumeFileInfo { fileName: string; mimeType?: string; size?: number; }
const emptyParsedResume: ParsedResume = { skills: [], experienceYears: 0 };
const getStoredUser = (): ProfileUser => {
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) as ProfileUser : { email: 'candidate@srms.com' };
  } catch {
    return { email: 'candidate@srms.com' };
  }
};

const formatFileSize = (size?: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '';

export default function CandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [position, setPosition] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [educationSummary, setEducationSummary] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<ResumeFileInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);

  const applyProfile = (data: CandidateProfileResponse) => {
    setProfile(data);
    setFullName(data.user.fullName || '');
    setEmail(data.user.email || '');
    setPhone(data.user.phone || '');
    setSkills(Array.isArray(data.skills) ? data.skills : []);
    setExperienceYears(data.experience?.years ?? 0);
    setPosition(data.experience?.position ?? '');
    setExperienceSummary(data.experience?.summary ?? '');
    setEducationSummary(data.education?.summary || `${data.education?.school || ''} ${data.education?.major || ''}`.trim());
    const storedResume = data.resumeUrl || '';
    setResumeUrl(storedResume.startsWith('http') ? storedResume : '');
    if (storedResume && !storedResume.startsWith('http')) setResumeFile({ fileName: storedResume });
  };

  useEffect(() => {
    let active = true;

    api.get('/candidate/profile')
      .then((response) => {
        if (!active) return;
        applyProfile(response.data as CandidateProfileResponse);
        setProfileError('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          const storedUser = getStoredUser();
          setFullName(storedUser.fullName || '');
          setEmail(storedUser.email || '');
          setPhone(storedUser.phone || '');
          setProfile(null);
          setProfileError('Bạn chưa có hồ sơ ứng viên. Hãy điền thông tin và lưu hồ sơ.');
        } else {
          setProfileError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((current) => [...current, trimmed]);
      setSkillInput('');
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const response = await api.put('/candidate/profile', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        skills,
        experience: { years: Number(experienceYears) || 0, position: position.trim(), summary: experienceSummary.trim() },
        education: { summary: educationSummary.trim() },
        resumeUrl: resumeUrl.trim() || undefined,
      });
      setIsSuccess(true);
      setMessage(response.data?.message || 'Đã lưu hồ sơ ứng viên.');
      if (response.data?.profile) applyProfile(response.data.profile as CandidateProfileResponse);
      setParsedResume(null);
      setProfileError('');
    } catch (error) {
      setIsSuccess(false);
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setUploadMessage('Vui lòng chọn file PDF hoặc DOCX.');
      setUploadSuccess(false);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadMessage('File không được vượt quá 5MB.');
      setUploadSuccess(false);
      return;
    }
    setParsing(true);
    setUploadMessage('');
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      await api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResumeFile({ fileName: selectedFile.name, mimeType: selectedFile.type, size: selectedFile.size });
      setResumeUrl('');
      const parseResponse = await api.post('/candidate/resume/parse');
      setParsedResume(parseResponse.data?.parsedResume || emptyParsedResume);
      setUploadSuccess(true);
      setUploadMessage('CV đã được đọc. Kiểm tra thông tin trích xuất bên dưới trước khi lưu.');
      setSelectedFile(null);
    } catch (error) {
      setUploadSuccess(false);
      setUploadMessage(getErrorMessage(error));
    } finally {
      setParsing(false);
    }
  };

  const applyParsedResume = () => {
    if (!parsedResume) return;
    if (parsedResume.fullName) setFullName(parsedResume.fullName);
    if (parsedResume.skills.length > 0) setSkills(parsedResume.skills);
    setExperienceYears(parsedResume.experienceYears);
    setPosition(parsedResume.position || '');
    setExperienceSummary(parsedResume.summary || '');
    setEducationSummary(parsedResume.education || '');
    setMessage('Thông tin AI đã được đưa vào form. Bạn có thể chỉnh sửa trước khi lưu.');
    setIsSuccess(true);
  };

  const updateParsedResume = (field: keyof ParsedResume, value: string | number | string[]) => {
    setParsedResume((current) => current ? { ...current, [field]: value } : current);
  };

  const currentUser = profile?.user || getStoredUser();

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải hồ sơ ứng viên...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-2xl font-black shadow-lg">{getInitials(fullName || currentUser.fullName || 'Ứng viên')}</div>
            <div><div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300"><User className="h-3 w-3" /> Hồ sơ ứng viên</div><h1 className="text-2xl font-bold">{fullName || 'Chưa cập nhật tên'}</h1><div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-300"><span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-indigo-400" />{email || currentUser.email}</span>{phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-indigo-400" />{phone}</span>}</div></div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs"><span className="text-slate-400">Trạng thái CV:</span><span className={`mt-1 flex items-center gap-1 font-bold ${resumeFile || resumeUrl ? 'text-emerald-400' : 'text-amber-400'}`}>{resumeFile || resumeUrl ? <><FileCheck className="h-4 w-4" /> Đã tải CV</> : <><AlertCircle className="h-4 w-4" /> Chưa tải CV</>}</span></div>
        </div>
      </section>
      {profileError && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="h-4 w-4 shrink-0" />{profileError}</div>}

      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-white p-6 shadow-sm">
        <div className="flex items-start gap-3 border-b border-indigo-100 pb-4"><div className="rounded-lg bg-indigo-600 p-2 text-white"><Sparkles className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Resume & AI parsing</h2><p className="text-xs text-slate-500">Upload PDF/DOCX, review the extracted information, then save it to your profile.</p></div></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 px-4 py-3 hover:border-indigo-400"><span className="flex min-w-0 items-center gap-3 text-xs font-semibold text-slate-700"><FileText className="h-5 w-5 shrink-0 text-indigo-600" /><span className="truncate">{selectedFile?.name || 'Choose a PDF or DOCX resume (max 5MB)'}</span></span><span className="ml-2 shrink-0 text-xs font-bold text-indigo-600">Browse</span><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} /></label><button type="button" disabled={!selectedFile || parsing} onClick={() => void handleUploadAndParse()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Upload className="h-4 w-4" />{parsing ? 'Reading resume...' : 'Upload & parse'}</button></div>
        {resumeFile && <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><FileCheck className="h-4 w-4 text-emerald-600" /><span className="font-semibold">{resumeFile.fileName}</span>{resumeFile.size && <span>({formatFileSize(resumeFile.size)})</span>}</div>}
        {uploadMessage && <div className={`mt-3 flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${uploadSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{uploadSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{uploadMessage}</div>}
      </section>

      {parsedResume && <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-amber-200 pb-4 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-900">Review extracted information</h2><p className="text-xs text-slate-600">AI output is a draft. Edit it here, then apply it to the profile form.</p></div><button type="button" onClick={applyParsedResume} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">Use extracted information</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Name<input value={parsedResume.fullName || ''} onChange={(event) => updateParsedResume('fullName', event.target.value)} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">Position<input value={parsedResume.position || ''} onChange={(event) => updateParsedResume('position', event.target.value)} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">Experience years<input type="number" min="0" value={parsedResume.experienceYears} onChange={(event) => updateParsedResume('experienceYears', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">Education<input value={parsedResume.education || ''} onChange={(event) => updateParsedResume('education', event.target.value)} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Skills<input value={parsedResume.skills.join(', ')} onChange={(event) => updateParsedResume('skills', event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean))} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Summary<textarea rows={3} value={parsedResume.summary || ''} onChange={(event) => updateParsedResume('summary', event.target.value)} className="mt-1 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /></label></div></section>}
 
  <form onSubmit={(event) => void handleSaveProfile(event)} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">Profile information</h2><p className="text-xs text-slate-500">Review or edit your information before saving.</p></div>{message && <div className={`flex items-center gap-2 rounded-xl border p-3.5 text-sm font-medium ${isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{message}</div>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500" /></label><label className="text-xs font-semibold text-slate-700">Email<input value={email} readOnly className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500" /></label><label className="text-xs font-semibold text-slate-700">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500" /></label></div><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Briefcase className="h-4 w-4 text-indigo-600" />Professional information</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Experience years<input type="number" min="0" max="50" value={experienceYears} onChange={(event) => setExperienceYears(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">Position<input value={position} onChange={(event) => setPosition(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Experience summary<textarea rows={3} value={experienceSummary} onChange={(event) => setExperienceSummary(event.target.value)} className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /></label></div></div><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><GraduationCap className="h-4 w-4 text-indigo-600" />Education</h3><input value={educationSummary} onChange={(event) => setEducationSummary(event.target.value)} placeholder="School, major, degree" className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /></div><div><h3 className="text-sm font-bold text-slate-800">Skills</h3><div className="mt-3 flex gap-2"><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddSkill(); } }} placeholder="Add a skill" className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /><button type="button" onClick={handleAddSkill} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><Plus className="h-3.5 w-3.5" />Add</button></div><div className="mt-3 flex min-h-10 flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">{skills.length ? skills.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{skill}<button type="button" onClick={() => setSkills((current) => current.filter((item) => item !== skill))}><X className="h-3 w-3" /></button></span>) : <span className="text-xs italic text-slate-400">No skills added.</span>}</div></div><div><label className="text-xs font-semibold text-slate-700">Online resume URL (optional)<input type="url" value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" /></label></div><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"><Save className="h-4 w-4" />{saving ? 'Saving profile...' : 'Save profile'}</button></form>
    </div>
  );
}
