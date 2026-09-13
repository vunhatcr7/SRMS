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
  Upload,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
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
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

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
          setProfileError('You do not have a candidate profile yet. Fill in your information and save.');
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
      setMessage(response.data?.message || 'Profile saved.');
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
      setUploadMessage('Please select a PDF or DOCX file.');
      setUploadSuccess(false);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadMessage('File size must not exceed 5MB.');
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
      setUploadMessage('Resume uploaded. Review the extracted information below before saving.');
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
    setMessage('Extracted information applied to the form. You can edit before saving.');
    setIsSuccess(true);
  };

  const updateParsedResume = (field: keyof ParsedResume, value: string | number | string[]) => {
    setParsedResume((current) => current ? { ...current, [field]: value } : current);
  };

  const currentUser = profile?.user || getStoredUser();

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-xl font-black ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
              {getInitials(fullName || currentUser.fullName || 'Candidate')}
            </div>
             <div>
               <div className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${isDark ? 'border-navy-700 bg-navy-850 text-brand-light' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                 <User className="h-3 w-3" /> Candidate profile
               </div>
               <h1 className={`mt-1 text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{fullName || 'Not provided'}</h1>
               <div className={`mt-1 flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                 <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{email || currentUser.email}</span>
                 {phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{phone}</span>}
               </div>
             </div>
          </div>
          <div className={`rounded-lg border px-3.5 py-2.5 text-xs ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
            <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Resume status:</span>
            <span className={`ml-1 flex items-center gap-1 font-bold ${resumeFile || resumeUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
              {resumeFile || resumeUrl ? <><FileCheck className="h-4 w-4" /> Uploaded</> : <><AlertCircle className="h-4 w-4" /> Not uploaded</>}
            </span>
          </div>
        </div>
      </section>

      {profileError && <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><AlertCircle className="h-4 w-4 shrink-0" />{profileError}</div>}

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
          <Upload className="h-4 w-4 text-brand" />
          <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Resume upload</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-lg border border-dashed px-4 py-3 hover:border-brand transition ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
            <span className={`flex min-w-0 items-center gap-3 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <FileText className="h-5 w-5 shrink-0 text-brand" />
              <span className="truncate">{selectedFile?.name || 'Choose a PDF or DOCX resume (max 5MB)'}</span>
            </span>
            <span className="ml-2 shrink-0 text-xs font-bold text-brand">Browse</span>
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <button type="button" disabled={!selectedFile || parsing} onClick={() => void handleUploadAndParse()} className="inline-flex items-center justify-center gap-2 rounded bg-brand px-5 py-3 text-xs font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
            <Upload className="h-4 w-4" />{parsing ? 'Reading...' : 'Upload & parse'}
          </button>
        </div>
        {resumeFile && <div className={`mt-3 flex items-center gap-2 rounded-lg border p-3 text-xs ${isDark ? 'border-navy-700 bg-navy-850 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><FileCheck className="h-4 w-4 text-emerald-400" /><span className="font-semibold">{resumeFile.fileName}</span>{resumeFile.size && <span>({formatFileSize(resumeFile.size)})</span>}</div>}
        {uploadMessage && <div className={`mt-3 flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${uploadSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>{uploadSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{uploadMessage}</div>}
      </section>

      {parsedResume && (
        <section className={`rounded-lg border p-5 ${isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50'}`}>
          <div className="flex flex-col justify-between gap-3 border-b border-amber-500/30 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Review extracted information</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI output is a draft. Edit it here, then save to your profile.</p>
            </div>
            <button type="button" onClick={applyParsedResume} className="inline-flex items-center justify-center gap-2 rounded bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark">
              Use extracted information
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Name</label>
              <input value={parsedResume.fullName || ''} onChange={(event) => updateParsedResume('fullName', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-amber-200 bg-white text-slate-900 focus:border-brand'}`} />
            </div>
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Position</label>
              <input value={parsedResume.position || ''} onChange={(event) => updateParsedResume('position', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-amber-200 bg-white text-slate-900 focus:border-brand'}`} />
            </div>
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience years</label>
              <input type="number" min="0" value={parsedResume.experienceYears} onChange={(event) => updateParsedResume('experienceYears', Number(event.target.value))} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-amber-200 bg-white text-slate-900 focus:border-brand'}`} />
            </div>
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Education</label>
              <input value={parsedResume.education || ''} onChange={(event) => updateParsedResume('education', event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-amber-200 bg-white text-slate-900 focus:border-brand'}`} />
            </div>
            <div className="sm:col-span-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Skills (comma separated)</label>
              <input value={parsedResume.skills.join(', ')} onChange={(event) => updateParsedResume('skills', event.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-amber-200 bg-white text-slate-900 focus:border-brand'}`} />
            </div>
          </div>
        </section>
      )}

      <form onSubmit={(event) => void handleSaveProfile(event)} className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`border-b pb-4 mb-4 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
          <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Profile information</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review or edit your information before saving.</p>
        </div>

        {message && <div className={`flex items-center gap-2 rounded-lg border p-3.5 text-sm font-medium mb-4 ${isSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>{isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{message}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full name</label>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
            <input value={email} readOnly className={`mt-1 w-full rounded border bg-navy-900 px-3 py-2 text-sm text-slate-500 cursor-not-allowed ${isDark ? 'border-navy-700' : 'border-slate-200 bg-slate-100'}`} />
          </div>
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone</label>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}><Briefcase className="h-4 w-4 text-brand" />Professional information</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience years</label>
              <input type="number" min="0" max="50" value={experienceYears} onChange={(event) => setExperienceYears(Number(event.target.value))} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </div>
            <div>
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Position</label>
              <input value={position} onChange={(event) => setPosition(event.target.value)} className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </div>
            <div className="sm:col-span-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience summary</label>
              <textarea value={experienceSummary} onChange={(event) => setExperienceSummary(event.target.value)} rows={3} className={`mt-1 w-full resize-none rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}><GraduationCap className="h-4 w-4 text-brand" />Education</h3>
          <div className="mt-4">
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Education summary</label>
            <textarea value={educationSummary} onChange={(event) => setEducationSummary(event.target.value)} rows={2} className={`mt-1 w-full resize-none rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}><FileText className="h-4 w-4 text-brand" />Skills</h3>
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add a skill and press Enter"
                className={`flex-1 rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`}
              />
              <button type="button" onClick={handleAddSkill} className="rounded bg-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-navy-700 bg-navy-850 text-brand-light' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                  {skill}
                  <button type="button" onClick={() => setSkills((current) => current.filter((s) => s !== skill))} className="ml-1 text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Resume URL</label>
          <input value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} placeholder="https://..." className={`mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-brand'}`} />
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => navigate('/candidate')} className={`rounded border px-4 py-2.5 text-sm font-semibold transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save profile</>}
          </button>
        </div>
      </form>
    </div>
  );
}
