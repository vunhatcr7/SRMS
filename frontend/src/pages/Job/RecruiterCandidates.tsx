import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, BriefcaseBusiness, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getScoreColor, getStageColor, getStageLabel } from '../../utils/formatters';

interface Application { id: string; stage: string; matchingScore: number; createdAt: string; job: { id: string; title: string; location: string; company?: { name: string } }; candidateProfile: { skills: string[]; experience?: { position?: string }; user: { id: string; fullName?: string; email: string } } }

export default function RecruiterCandidates() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobFilter, setJobFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortByScore, setSortByScore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    let active = true;
    api.get('/application/recruiter').then((response) => { if (active) setApplications(Array.isArray(response.data) ? response.data : []); }).catch(() => { if (active) setError('Unable to load candidates.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  const jobs = useMemo(() => Array.from(new Map(applications.map((item) => [item.job.id, item.job])).values()), [applications]);
  const filtered = useMemo(() => applications.filter((item) => {
    const name = item.candidateProfile.user.fullName || item.candidateProfile.user.email;
    return (jobFilter === 'all' || item.job.id === jobFilter) && (stageFilter === 'all' || item.stage === stageFilter) && name.toLowerCase().includes(search.toLowerCase());
  }).sort((left, right) => sortByScore ? right.matchingScore - left.matchingScore : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()), [applications, jobFilter, stageFilter, search, sortByScore]);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading candidates...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Recruiter workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">Candidates</h1>
        <p className="mt-2 text-sm text-slate-400">Review candidates who applied to jobs you manage.</p>
      </div>

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">{error}</div>}

      <div className={`rounded-lg border p-4 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate"
              className={`w-full rounded border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none transition ${
                isDark ? 'border-navy-700 text-slate-200 placeholder:text-slate-500 focus:border-brand' : 'border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-brand'
              }`}
            />
          </label>
          <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} className={`rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-200 focus:border-brand' : 'border-slate-200 text-slate-700 focus:border-brand'}`}>
            <option value="all">All jobs</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={`rounded border bg-transparent px-3 py-2.5 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-200 focus:border-brand' : 'border-slate-200 text-slate-700 focus:border-brand'}`}>
            <option value="all">All stages</option>
            {['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((stage) => <option key={stage} value={stage}>{getStageLabel(stage)}</option>)}
          </select>
          <button type="button" onClick={() => setSortByScore((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded border border-navy-700 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-navy-600 hover:text-slate-100">
            <ArrowDownUp className="h-4 w-4" />
            {sortByScore ? 'Score: high to low' : 'Newest first'}
          </button>
        </div>
      </div>

      {!error && filtered.length === 0 && (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className="mt-3 font-bold text-slate-200">No candidates found</h2>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
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
                      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${isDark ? 'bg-navy-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
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
                    <span className={`inline-flex rounded border px-2 py-1 text-[11px] font-semibold ${getStageColor(item.stage)}`}>
                      {getStageLabel(item.stage)}
                    </span>
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
  );
}
