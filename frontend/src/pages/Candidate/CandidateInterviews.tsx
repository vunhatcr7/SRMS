import { useMemo, useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, RefreshCw, User, Video, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { formatDateTime, getErrorMessage } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';

interface CandidateInterviewItem {
  id: string;
  applicationId: string;
  scheduledAt: string;
  locationOrLink: string;
  interviewerName: string;
  status: string;
  type?: string;
  notes?: string | null;
  createdAt: string;
  application: {
    id: string;
    stage: string;
    job: {
      id: string;
      title: string;
      location?: string;
      company?: {
        name: string;
        logo?: string;
      };
    };
  };
}

export default function CandidateInterviews() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [interviews, setInterviews] = useState<CandidateInterviewItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const isLoading = useMinimumLoading(dataLoaded, 1000);

  useEffect(() => {
    let active = true;

    api.get('/interview/candidate')
      .then((res) => {
        if (active) {
          setInterviews(Array.isArray(res.data) ? res.data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err) || 'Unable to load interviews.');
        }
      })
      .finally(() => {
        if (active) {
          setDataLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    api.get('/interview/candidate')
      .then((res) => {
        setInterviews(Array.isArray(res.data) ? res.data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err) || 'Unable to load interviews.');
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemStatus = (item.status || 'SCHEDULED').toUpperCase();
      return statusFilter === 'ALL' || itemStatus === statusFilter;
    });
  }, [interviews, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span></Badge>;
      case 'CANCELLED':
        return <Badge variant="danger"><span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Cancelled</span></Badge>;
      default:
        return <Badge variant="brand"><span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span></Badge>;
    }
  };

  const renderInterviewCard = (item: CandidateInterviewItem) => {
    const job = item.application?.job;
    const isOnline = (item.type || 'ONLINE').toUpperCase() === 'ONLINE';
    const isLink = item.locationOrLink?.startsWith('http://') || item.locationOrLink?.startsWith('https://');

    return (
      <Card key={item.id} padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{job?.title || 'Job'}</h2>
                {getStatusBadge(item.status || 'SCHEDULED')}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {job?.company?.name || 'Company'} · {job?.location || 'Remote'}
              </p>
            </div>
          </div>

          <div className={`rounded-lg border px-3.5 py-2 ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-200">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              <span>{formatDateTime(item.scheduledAt)}</span>
            </div>
            <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isOnline ? 'Online interview' : 'On-site interview'}
            </span>
          </div>
        </div>

        <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3 text-xs ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Video className="h-4 w-4 text-brand shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <div className="flex-1 truncate">
              <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {isOnline ? 'Meeting link' : 'Location'}
              </span>
              {isLink ? (
                <a
                  href={item.locationOrLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark transition mt-0.5"
                >
                  <span>Join meeting</span>
                </a>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-slate-200 block mt-0.5">{item.locationOrLink}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Interviewer</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{item.interviewerName}</span>
            </div>
          </div>
        </div>

        {item.notes && (
          <div className={`mt-3 text-xs rounded-lg border p-2.5 ${isDark ? 'text-slate-400 bg-amber-500/5 border-amber-500/20' : 'text-slate-600 bg-amber-50 border-amber-200'}`}>
            <strong className="text-amber-500">Note:</strong> {item.notes}
          </div>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-16 w-40 rounded-lg" />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Candidate workspace</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">My interviews</h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Track your interview schedule, time, and details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-300 dark:hover:border-navy-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <Card className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <span>{error}</span>
        </Card>
      )}

      <div className={`flex flex-wrap gap-2 rounded-lg border p-3.5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        {[
          { key: 'ALL', label: 'All', count: interviews.length },
          { key: 'SCHEDULED', label: 'Scheduled', count: interviews.filter((i) => (i.status || 'SCHEDULED') === 'SCHEDULED').length },
          { key: 'COMPLETED', label: 'Completed', count: interviews.filter((i) => i.status === 'COMPLETED').length },
          { key: 'CANCELLED', label: 'Cancelled', count: interviews.filter((i) => i.status === 'CANCELLED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-brand text-white'
                : isDark
                  ? 'bg-navy-800 border border-navy-700 text-slate-300 hover:border-navy-600'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-white/20 text-white' : isDark ? 'bg-navy-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredInterviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No interviews yet"
            description="When recruiters schedule interviews for your applications, they will appear here."
            action={
              <button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-4 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">
                Browse jobs
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredInterviews.map((item) => renderInterviewCard(item))}
        </div>
      )}
    </div>
  );
}
