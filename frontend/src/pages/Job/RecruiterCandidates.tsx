import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, BriefcaseBusiness, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { formatDate, getScoreColor, getStageLabel } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Application { id: string; stage: string; matchingScore: number; createdAt: string; job: { id: string; title: string; location: string; company?: { name: string } }; candidateProfile: { skills: string[]; experience?: { position?: string }; user: { id: string; fullName?: string; email: string } } }

export default function RecruiterCandidates() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobFilter, setJobFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortByScore, setSortByScore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/application/recruiter').then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); }).catch(() => { if (active) setError('Unable to load candidates.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const jobs = useMemo(() => Array.from(new Map(applications.map((item) => [item.job.id, item.job])).values()), [applications]);
  const filtered = useMemo(() => applications.filter((item) => {
    const name = item.candidateProfile.user.fullName || item.candidateProfile.user.email;
    return (jobFilter === 'all' || item.job.id === jobFilter) && (stageFilter === 'all' || item.stage === stageFilter) && name.toLowerCase().includes(search.toLowerCase());
  }).sort((left, right) => sortByScore ? right.matchingScore - left.matchingScore : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()), [applications, jobFilter, stageFilter, search, sortByScore]);

  if (loading) return (
    <div className="flex min-h-[320px] items-center justify-center">
      <LoadingSpinner message="Loading candidates..." />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recruiter workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Candidates</h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Review candidates who applied to jobs you manage.</p>
      </div>

      {error && <Card className="text-sm text-rose-600 dark:text-rose-400">{error}</Card>}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate"
              className={`w-full rounded-md border bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition ${isDark ? 'border-navy-700 bg-navy-900 text-slate-200 placeholder:text-slate-500 focus:border-brand' : 'border-slate-300 text-slate-700 placeholder:text-slate-400 focus:border-brand'}`}
            />
          </div>
          <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} className={`rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 bg-navy-900 text-slate-200 focus:border-brand' : 'border-slate-300 text-slate-700 focus:border-brand'}`}>
            <option value="all">All jobs</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={`rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 bg-navy-900 text-slate-200 focus:border-brand' : 'border-slate-300 text-slate-700 focus:border-brand'}`}>
            <option value="all">All stages</option>
            {['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((stage) => <option key={stage} value={stage}>{getStageLabel(stage)}</option>)}
          </select>
          <button type="button" onClick={() => setSortByScore((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-navy-700 dark:text-slate-300 dark:hover:border-navy-600">
            <ArrowDownUp className="h-4 w-4" />
            {sortByScore ? 'Score: high to low' : 'Newest first'}
          </button>
        </div>
      </Card>

      {!error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="No candidates found"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      )}

      {!error && filtered.length > 0 && (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className={isDark ? 'bg-navy-900 text-[11px] uppercase tracking-wider text-slate-500' : 'bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500'}>
                <tr>
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Match score</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const user = item.candidateProfile.user;
                  const name = user.fullName || user.email;
                  return (
                    <tr key={item.id} className={`border-t transition ${isDark ? 'border-navy-700 hover:bg-navy-750 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={name.charAt(0).toUpperCase()} size="sm" />
                          <div className="min-w-0">
                            <div className={`truncate font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</div>
                            <div className={`truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.job.title}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.job.company?.name || 'Company'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${getScoreColor(item.matchingScore)}`}>
                          {Math.round(item.matchingScore)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="slate">{getStageLabel(item.stage)}</Badge>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => navigate(`/recruiter/candidates/${user.id}`)} className="text-xs font-semibold text-brand hover:text-brand-light">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
