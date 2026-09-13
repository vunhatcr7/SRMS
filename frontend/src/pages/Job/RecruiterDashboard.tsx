import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { formatDate, getStageLabel } from '../../utils/formatters';
import CreateJobModal from '../../components/CreateJobModal';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface DashboardData {
  role: string;
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingApplications: number;
    scheduledInterviews: number;
    hiredCount: number;
    applicationsByStage: Record<string, number>;
  };
  recentApplications: Array<{
    id: string;
    stage: string;
    matchingScore?: number;
    createdAt: string;
    job: { title: string; location: string };
    candidateProfile?: { include: { user: { fullName: string; email: string } } };
  }>;
}

interface InterviewItem {
  id: string;
  scheduledAt: string;
  status: string;
  application: {
    job: { title: string };
    candidateProfile?: { user: { fullName?: string; email: string } };
  };
}

export default function RecruiterDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');

  const isLoading = useMinimumLoading(dataLoaded, 1000);

  const showToast = (message: string, isSuccess: boolean) => {
    setToast({ message, isSuccess });
    window.setTimeout(() => setToast(null), 3500);
  };

  const openCreateJob = () => {
    if (searchParams.get('createJob') !== '1') {
      const next = new URLSearchParams(searchParams);
      next.set('createJob', '1');
      setSearchParams(next, { replace: true });
    }
  };

  const closeCreateJob = () => {
    if (searchParams.has('createJob')) {
      const next = new URLSearchParams(searchParams);
      next.delete('createJob');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/dashboard'),
      api.get('/interview/recruiter'),
    ])
      .then(([dashRes, intRes]) => {
        if (active) {
          setDashboard(dashRes.data as DashboardData);
          setInterviews(Array.isArray(intRes.data) ? intRes.data : []);
        }
      })
      .catch(() => { if (active) setError('Unable to load dashboard.'); })
      .finally(() => { if (active) setDataLoaded(true); });
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} padding="sm">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
        </Card>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <Skeleton className="h-4 w-32 mb-5" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-4 w-full" />
              ))}
            </div>
          </Card>
          <Card>
            <Skeleton className="h-4 w-32 mb-5" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <Skeleton className="h-4 w-32 mb-5" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error || !dashboard) {
    return <Card className="text-sm text-rose-600 dark:text-rose-400">{error || 'No dashboard data.'}</Card>;
  }

  const { summary } = dashboard;
  const upcomingInterviews = interviews
    .filter((i) => i.status === 'SCHEDULED')
    .slice(0, 5)
    .map((i) => ({
      name: i.application.candidateProfile?.user.fullName || 'Candidate',
      role: i.application.job.title,
      time: formatDate(i.scheduledAt),
      mode: i.scheduledAt,
    }));

  const pipelineStages = [
    { name: 'Applied', key: 'APPLIED' },
    { name: 'Screening', key: 'SCREENING' },
    { name: 'Interview', key: 'INTERVIEW' },
    { name: 'Offer', key: 'OFFER' },
    { name: 'Hired', key: 'HIRED' },
    { name: 'Rejected', key: 'REJECTED' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-md border px-4 py-3 text-xs font-semibold shadow-card ${
            toast.isSuccess
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toast.isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <Card>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Good morning
            </p>
            <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recruiter
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Here&apos;s what&apos;s happening across your hiring pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateJob}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Briefcase className="h-4 w-4" />
            Create job
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card padding="sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Open roles</p>
            <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.activeJobs}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active applications</p>
            <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.totalApplications}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scheduled interviews</p>
            <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.scheduledInterviews}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Offers pending</p>
            <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.applicationsByStage.OFFER || 0}</p>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Hiring pipeline</h3>
          </div>

          <div className="mt-5 space-y-3">
            {pipelineStages.map((stage) => {
              const count = summary.applicationsByStage[stage.key] || 0;
              const colors: Record<string, string> = {
                APPLIED: 'bg-sky-500',
                SCREENING: 'bg-indigo-500',
                INTERVIEW: 'bg-amber-500',
                OFFER: 'bg-pink-500',
                HIRED: 'bg-emerald-500',
                REJECTED: 'bg-rose-500',
              };
              return (
                <div key={stage.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${colors[stage.key] || 'bg-slate-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stage.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming interviews</h3>
          </div>

          <div className="mt-5 space-y-2">
            {upcomingInterviews.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No upcoming interviews.</p>
            ) : (
              upcomingInterviews.map((person, idx) => (
                <div key={idx} className={`flex items-center gap-3 rounded-lg border p-3 ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                  <Avatar name={person.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{person.name}</div>
                    <div className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{person.role}</div>
                  </div>
                  <div className={`text-right text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <div className="font-medium">{person.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent activity</h3>
        </div>

        <div className={`mt-5 overflow-hidden rounded-lg border ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className={isDark ? 'bg-navy-900 text-[11px] uppercase tracking-wider text-slate-500' : 'bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500'}>
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentApplications.length > 0 ? (
                dashboard.recentApplications.map((item) => (
                  <tr key={item.id} className={`border-t ${isDark ? 'border-navy-700 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                    <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.candidateProfile?.include?.user?.fullName || 'Candidate'}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.job.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="slate">{getStageLabel(item.stage)}</Badge>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No recent activity to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {searchParams.get('createJob') === '1' && (
        <CreateJobModal
          open
          onClose={closeCreateJob}
          onCreated={() => showToast('Job created successfully!', true)}
        />
      )}
    </div>
  );
}
