import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { getStageLabel } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface Application {
  id: string;
  stage: string;
  matchingScore?: number;
  createdAt: string;
  job: { title: string; location: string; company?: { name: string } };
}

export default function CandidateApplications() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');

  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    let active = true;
    api.get('/application/my')
      .then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setError('Unable to load applications.'); })
      .finally(() => { if (active) setDataLoaded(true); });
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} padding="none" className="overflow-hidden">
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className={`border-t px-4 py-3 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const inProgress = applications.filter(a => ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'].includes(a.stage)).length;
  const interviews = applications.filter(a => a.stage === 'INTERVIEW').length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Your journey</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">My applications</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Track the roles you're exploring and the next step for each application.</p>
      </div>

      {error && <Card className="text-sm text-rose-600 dark:text-rose-400">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total applications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{applications.length}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">In progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{inProgress}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Interviews</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{interviews}</p>
        </Card>
      </div>

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="No applications yet"
            description="Explore active jobs and submit your first application."
            action={
              <button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-4 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">
                Find more roles
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card key={application.id} padding="none" className="overflow-hidden">
              <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{application.job.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {application.job.company?.name || 'Company'} · {application.job.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Applied {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(application.createdAt))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="slate">{getStageLabel(application.stage)}</Badge>
                </div>
              </div>
              <div className={`flex items-center justify-between gap-2 border-t px-4 py-3 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => navigate(`/candidate/applications/${application.id}`)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition"
                >
                  View details <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
