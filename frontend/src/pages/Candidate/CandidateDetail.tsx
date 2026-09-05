import { useEffect, useState } from 'react';
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
  RefreshCw, 
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getInitials, formatDate } from '../../utils/formatters';
import SkillTag from '../../components/ui/SkillTag';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileUserId) return;
    let active = true;

    api.get(`/candidate/profile/${profileUserId}`)
      .then((res) => {
        if (!active) return;
        setProfile(res.data);
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
  }, [profileUserId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Đang tải thông tin ứng viên...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy hồ sơ ứng viên</h3>
        <p className="text-sm text-slate-500 mb-5">{error || 'Hồ sơ có thể chưa được tạo hoặc không tồn tại.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>
    );
  }

  const user = profile.user;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang trước
      </button>

      {/* Header Profile Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-indigo-300/30 shrink-0">
              {getInitials(user.fullName)}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-1 border border-indigo-400/20">
                <User className="h-3 w-3" />
                Hồ Sơ Ứng Viên Chi Tiết
              </div>
              <h2 className="text-2xl font-bold">{user.fullName || 'Chưa cập nhật tên'}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Gia nhập: {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {profile.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-xs font-bold shadow hover:bg-slate-100 transition shrink-0"
            >
              <FileText className="h-4 w-4 text-indigo-600" />
              Xem Bản CV Gốc
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Kỹ Năng Chuyên Môn
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <SkillTag key={skill} skill={skill} variant="default" />
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Chưa có kỹ năng nào được cập nhật.</span>
          )}
        </div>
      </section>

      {/* Experience Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          <Briefcase className="h-4 w-4 text-indigo-600" />
          Kinh Nghiệm Làm Việc
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-400 block mb-1">Số năm kinh nghiệm</span>
            <span className="text-sm font-bold text-slate-800">
              {profile.experience?.years !== undefined ? `${profile.experience.years} năm` : 'Chưa cập nhật'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-400 block mb-1">Vị trí hiện tại / gần nhất</span>
            <span className="text-sm font-bold text-slate-800">
              {profile.experience?.position || 'Chưa cập nhật'}
            </span>
          </div>
        </div>

        {profile.experience?.summary && (
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">Tóm tắt quá trình làm việc:</span>
            {profile.experience.summary}
          </div>
        )}
      </section>

      {/* Education Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          Học Vấn & Bằng Cấp
        </div>
        <p className="text-xs text-slate-700">
          {profile.education?.summary || 'Chưa cập nhật thông tin học vấn.'}
        </p>
      </section>

      {/* Extracted Resume Text Preview */}
      {profile.resumeText && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <FileText className="h-4 w-4 text-indigo-600" />
              Nội Dung Trích Xuất Từ CV
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Độ dài: {profile.resumeText.length} ký tự
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-50 p-4 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap border border-slate-100">
            {profile.resumeText}
          </div>
        </section>
      )}
    </div>
  );
}

