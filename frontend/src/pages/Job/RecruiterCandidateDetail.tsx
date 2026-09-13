import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Mail, Phone, RefreshCw, User } from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage, getScoreColor } from '../../utils/formatters';
import StatusBadge from '../../components/ui/StatusBadge';

interface Application { id: string; stage: string; matchingScore: number; skillScore: number; experienceScore: number; aiExplanation?: string | null; createdAt: string; job: { title: string; location: string; salaryRange?: string | null; company?: { name: string } }; candidateProfile: { skills: string[]; experience?: { years?: number; position?: string; summary?: string }; education?: { summary?: string; school?: string; major?: string }; resumeUrl?: string | null; user: { id: string; fullName?: string; email: string; phone?: string } } }

export default function RecruiterCandidateDetail() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  useEffect(() => { if (!candidateId) return; let active = true; api.get(`/application/recruiter/candidate/${candidateId}`).then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); }).catch((requestError) => { if (active) setError(getErrorMessage(requestError)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [candidateId]);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading candidate profile...</div>;
  if (error || applications.length === 0) return <div className="space-y-4"><button type="button" onClick={() => navigate('/recruiter/candidates')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4" />Back to candidates</button><div className={`rounded-lg border p-5 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error || 'Candidate not found in your managed jobs.'}</div></div>;

  const first = applications[0];
  const candidate = first.candidateProfile;
  const user = candidate.user;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/recruiter/candidates')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition">
        <ArrowLeft className="h-4 w-4" /> Back to candidates
      </button>

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-slate-900 text-white'}`}>
        <div className="flex items-center gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-lg text-xl font-black ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-brand/20 text-brand-light'}`}>
            {(user.fullName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-light">
              <User className="h-4 w-4" /> Candidate profile
            </div>
            <h1 className="mt-1 text-xl font-bold text-white">{user.fullName || 'Unnamed candidate'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{user.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="text-base font-bold text-slate-100">Professional profile</h2>
          <p className="mt-3 text-sm text-slate-300">{candidate.experience?.position || 'Position not specified'} · {candidate.experience?.years ?? 0} years</p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">{candidate.experience?.summary || 'No experience summary provided.'}</p>

          <h3 className="mt-5 font-semibold text-slate-200">Skills</h3>
          <p className="mt-2 text-sm text-slate-400">{candidate.skills.join(', ') || 'No skills listed.'}</p>

          <h3 className="mt-5 font-semibold text-slate-200">Education</h3>
          <p className="mt-2 text-sm text-slate-400">{candidate.education?.summary || [candidate.education?.school, candidate.education?.major].filter(Boolean).join(' - ') || 'No education information.'}</p>

          {candidate.resumeUrl && (
            <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded border border-navy-700 bg-navy-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-navy-600 hover:text-slate-100">
              <FileText className="h-4 w-4" /> View resume <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          )}
        </section>

        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="text-base font-bold text-slate-100">Applications</h2>
          <div className="mt-4 space-y-3">
            {applications.map((app) => (
              <div key={app.id} className={`flex items-center justify-between rounded-lg border p-3 ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{app.job.title}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{app.job.company?.name || 'Company'} · {app.job.location}</div>
                </div>
                <div className="text-right">
                  <StatusBadge stage={app.stage} />
                  <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Score: <span className={getScoreColor(app.matchingScore)}>{Math.round(app.matchingScore)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
