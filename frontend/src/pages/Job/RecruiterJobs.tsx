import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Building2, Edit3, Eye, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { formatDate } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface Job { id: string; title: string; location: string; salaryRange?: string | null; isActive: boolean; createdAt: string; company?: { name: string }; _count?: { applications: number } }

export default function RecruiterJobs() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');

  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    let active = true;
    api.get('/job/manage').then((response) => { if (active) setJobs(Array.isArray(response.data) ? response.data : []); }).catch(() => { if (active) setError('Unable to load jobs.'); }).finally(() => { if (active) setDataLoaded(true); });
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} padding="lg" className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <Skeleton className="h-3 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recruiter workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">My jobs</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage the roles owned by your recruiter account.</p>
        </div>
        <button type="button" onClick={() => navigate('/recruiter/jobs/create')} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
          Create job
        </button>
      </div>

      {error && <Card className="text-sm text-rose-600 dark:text-rose-400">{error}</Card>}

      {!error && jobs.length === 0 && (
        <Card>
          <EmptyState
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="No jobs yet"
            description="Create your first role to start recruiting."
            action={
              <button type="button" onClick={() => navigate('/recruiter/jobs/create')} className="mt-4 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">
                Create job
              </button>
            }
          />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id} padding="lg" className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{job.title}</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p>
                </div>
              </div>
              <Badge variant={job.isActive ? 'success' : 'slate'}>{job.isActive ? 'Active' : 'Closed'}</Badge>
            </div>

            <div className={`mt-4 flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                {job.location}
              </span>
              <span>Created {formatDate(job.createdAt)}</span>
            </div>

            <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">{job._count?.applications ?? 0} applications</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}`)} className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition hover:text-slate-700 dark:border-navy-700 dark:text-slate-400 dark:hover:text-slate-200" title="View">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition hover:text-slate-700 dark:border-navy-700 dark:text-slate-400 dark:hover:text-slate-200" title="Edit">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
