import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, RefreshCw, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getErrorMessage, getScoreColor, getStageLabel } from '../../utils/formatters';
import StatusBadge from '../../components/ui/StatusBadge';

interface Application {
  id: string;
  stage: string;
  matchingScore?: number;
  skillScore?: number;
  experienceScore?: number;
  aiExplanation?: string | null;
  createdAt: string;
  job: { title: string; location: string; description: string; requirements: string; salaryRange?: string | null; company?: { name: string; website?: string | null } };
}

const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

export default function CandidateApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    api.get(`/application/my/${applicationId}`)
      .then((response) => { if (active) setApplication(response.data as Application); })
      .catch((requestError: unknown) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applicationId]);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading application details...</div>;
  if (error || !application) return <div className="space-y-4"><button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light"><ArrowLeft className="h-4 w-4" />Back to applications</button><div className={`rounded-lg border p-6 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><AlertCircle className="mb-2 h-5 w-5" />{error || 'Application not found.'}</div></div>;

  const rejected = application.stage === 'REJECTED';
  const currentIndex = stages.indexOf(application.stage);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition">
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </button>

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{application.job.company?.name || 'Company'}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">{application.job.title}</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Applied {formatDate(application.createdAt)} · {application.job.location}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recruitment progress</h2>
            <p className="mt-1 text-xs text-slate-400">Current stage: <span className="ml-1"><StatusBadge stage={application.stage} /></span></p>
          </div>
          {typeof application.matchingScore === 'number' && (
            <div className="text-left sm:text-right">
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Matching score</p>
              <p className={`text-3xl font-black ${getScoreColor(application.matchingScore)}`}>{Math.round(application.matchingScore)}%</p>
            </div>
          )}
        </div>

        {rejected ? (
          <div className={`mt-6 rounded-lg border p-4 text-sm font-semibold ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            This application was not selected for the next stage.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-5 gap-2">
            {stages.map((stage, index) => {
              const complete = currentIndex >= index;
              return (
                <div key={stage} className="text-center">
                  <div className={`mx-auto h-2 w-full rounded-full mb-2 ${complete ? 'bg-brand' : 'bg-navy-700'}`} />
                  <span className={`text-[11px] font-medium ${complete ? 'text-slate-200' : 'text-slate-500'}`}>{getStageLabel(stage)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-100"><Briefcase className="h-5 w-5 text-brand" />Description</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{application.job.description}</p>
        </section>
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-100"><FileText className="h-5 w-5 text-brand" />Requirements</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{application.job.requirements}</p>
        </section>
      </div>
    </div>
  );
}
