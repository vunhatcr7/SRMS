import { useEffect, useState } from 'react';
import { BriefcaseBusiness, FileText, RefreshCw, Users } from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminSummary {
  totalCandidates: number;
  totalRecruiters: number;
  totalJobs: number;
  totalApplications: number;
}

const metrics: Array<{
  key: keyof AdminSummary;
  label: string;
  icon: typeof Users;
}> = [
  { key: 'totalCandidates', label: 'Candidates', icon: Users },
  { key: 'totalRecruiters', label: 'Recruiters', icon: Users },
  { key: 'totalJobs', label: 'Jobs', icon: BriefcaseBusiness },
  { key: 'totalApplications', label: 'Applications', icon: FileText },
];

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api.get('/admin/dashboard')
      .then((response) => {
        if (active) setSummary(response.data.summary as AdminSummary);
      })
      .catch((requestError: unknown) => {
        const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (active) setError(message || 'Không thể tải thống kê quản trị.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Admin Dashboard"
        description="Tổng quan số lượng tài khoản và hoạt động tuyển dụng."
        action={
          <button
            type="button"
            onClick={retry}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-navy-700 dark:text-slate-200 dark:hover:bg-navy-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        }
      />

      {error && (
        <Card className="border-rose-200 text-sm text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
          <div className="flex items-center justify-between gap-3">
            <p>{error}</p>
            <button type="button" onClick={retry} className="font-semibold underline">
              Thử lại
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="flex items-center gap-4">
            <div className="rounded-lg bg-brand/10 p-3 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {loading || !summary ? '—' : summary[key].toLocaleString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
