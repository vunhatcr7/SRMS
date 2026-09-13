import { useEffect, useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange?: string | null;
  description: string;
  requirements?: string;
  createdAt: string;
  company?: { name: string };
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));

export default function CandidateJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');

  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    let active = true;
    api.get('/job?active=true')
      .then((response) => {
        if (active) setJobs(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (active) setError('Unable to load jobs.');
      })
      .finally(() => {
        if (active) setDataLoaded(true);
      });
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} padding="lg" className="flex flex-col">
              <div className="space-y-2 mb-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mb-4" />
              <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Opportunities</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Find your next role</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Explore roles that match your strengths, working style, and next chapter.</p>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{jobs.length} roles available</p>
      </div>

      {error && <Card className="text-sm text-rose-600 dark:text-rose-400">{error}</Card>}

      {!error && jobs.length === 0 && (
        <Card>
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title="No active jobs yet"
            description="Check back later for new opportunities."
          />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} padding="lg" className="flex flex-col">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{job.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{job.company?.name || 'Company'}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                {job.description || job.requirements || 'No description provided.'}
              </p>
            </div>

            <div className="mt-5 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                <span>{job.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-200">{job.salaryRange || 'Competitive'}</span>
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/candidate/jobs/${job.id}`)}
              className="mt-5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View role
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
