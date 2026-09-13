import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials, formatDate } from '../../utils/formatters';
import SkillTag from '../../components/ui/SkillTag';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface CandidateProfileDetail {
  id: string;
  userId: string;
  skills: string[];
  experience?: {
    years?: number;
    position?: string;
    summary?: string;
  } | null;
  education?: {
    school?: string;
    major?: string;
    summary?: string;
  } | null;
  resumeUrl?: string | null;
  resumeText?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName?: string;
    email: string;
    phone?: string;
    avatar?: string;
    createdAt?: string;
  };
}

export default function CandidateDetail() {
  const { candidateId, userId } = useParams<{ candidateId?: string; userId?: string }>();
  const navigate = useNavigate();
  const profileUserId = candidateId || userId;

  const [profile, setProfile] = useState<CandidateProfileDetail | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    if (!profileUserId) return;
    let active = true;

    api.get(`/candidate/profile/${profileUserId}`)
      .then((res) => {
        if (!active) return;
        setProfile(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!active) return;
        setDataLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [profileUserId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Skeleton className="h-4 w-24" />
        <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className={`p-3.5 rounded-lg border ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <Skeleton className="h-5 w-24 mb-3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
        <div className={`max-w-3xl mx-auto mt-10 p-8 rounded-lg border text-center ${isDark ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}`}>
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-3" />
          <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Candidate profile not found</h3>
          <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{error || 'Profile may not exist yet.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark transition"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const user = profile.user;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl font-black ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
              {getInitials(user.fullName)}
            </div>
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-semibold mb-1 ${isDark ? 'border-navy-700 bg-navy-850 text-brand-light' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                <User className="h-3 w-3" /> Candidate profile
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user.fullName || 'Unnamed'}</h2>
              <div className={`mt-1.5 flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                {user.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>
                )}
                <span className="flex items-center gap-1 text-slate-500">
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 shrink-0 ${
                  isDark
                    ? 'border-navy-700 bg-navy-800 text-slate-300 hover:border-navy-600 hover:text-slate-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
              <FileText className="h-4 w-4 text-brand" />
              View resume
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          )}
        </div>
      </div>

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 text-sm font-bold border-b pb-3 mb-3 ${isDark ? 'text-slate-100 border-navy-700' : 'text-slate-900 border-slate-200'}`}>
          <Briefcase className="h-4 w-4 text-brand" />
          Skills
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <SkillTag key={skill} skill={skill} variant="default" />
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">No skills updated yet.</span>
          )}
        </div>
      </section>

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 text-sm font-bold border-b pb-3 mb-4 ${isDark ? 'text-slate-100 border-navy-700' : 'text-slate-900 border-slate-200'}`}>
          <Briefcase className="h-4 w-4 text-brand" />
          Work experience
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className={`p-3.5 rounded-lg border ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
            <span className={`font-semibold block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Years of experience</span>
            <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {profile.experience?.years !== undefined ? `${profile.experience.years} years` : 'Not provided'}
            </span>
          </div>

          <div className={`p-3.5 rounded-lg border ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
            <span className={`font-semibold block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Current / latest position</span>
            <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {profile.experience?.position || 'Not provided'}
            </span>
          </div>
        </div>

        {profile.experience?.summary && (
          <div className={`mt-4 text-xs leading-relaxed rounded-lg border p-4 ${isDark ? 'bg-navy-850 border-navy-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <span className={`font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience summary:</span>
            {profile.experience.summary}
          </div>
        )}
      </section>

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 text-sm font-bold border-b pb-3 mb-3 ${isDark ? 'text-slate-100 border-navy-700' : 'text-slate-900 border-slate-200'}`}>
          <GraduationCap className="h-4 w-4 text-brand" />
          Education
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {profile.education?.summary || 'No education information provided.'}
        </p>
      </section>

      {profile.resumeText && (
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <FileText className="h-4 w-4 text-brand" />
              Extracted resume text
            </div>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {profile.resumeText.length} characters
            </span>
          </div>
          <div className={`max-h-64 overflow-y-auto rounded-lg border p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-navy-900 border-navy-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            {profile.resumeText}
          </div>
        </section>
      )}
    </div>
  );
}


