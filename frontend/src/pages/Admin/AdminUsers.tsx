import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
  role: 'CANDIDATE' | 'RECRUITER';
  phone: string | null;
  createdAt: string;
}

interface UserResponse {
  users: AdminUser[];
  pagination: { page: number; total: number; totalPages: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState<'ALL' | AdminUser['role']>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    api.get('/admin/users', {
        params: { role, search, page, limit: 20 },
      })
      .then((response) => {
        if (!active) return;
        const data = response.data as UserResponse;
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      })
      .catch((requestError: unknown) => {
        const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (active) setError(message || 'Không thể tải danh sách tài khoản.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, reloadKey, role, search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    if (nextSearch === search && page === 1) return;
    setLoading(true);
    setError('');
    setPage(1);
    setSearch(nextSearch);
  };

  const handleRoleChange = (value: 'ALL' | AdminUser['role']) => {
    if (value === role && page === 1) return;
    setLoading(true);
    setError('');
    setRole(value);
    setPage(1);
  };

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="User Management" description="Tìm kiếm và lọc tài khoản Candidate, Recruiter." />

      <Card className="border-amber-200 bg-amber-50 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Schema hiện tại chưa có trường trạng thái tài khoản, vì vậy trang này chỉ hỗ trợ xem, tìm kiếm và lọc.
      </Card>

      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên hoặc email"
              maxLength={100}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
            />
          </label>
          <select
            value={role}
            onChange={(event) => handleRoleChange(event.target.value as 'ALL' | AdminUser['role'])}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
          >
            <option value="ALL">All roles</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="RECRUITER">Recruiter</option>
          </select>
          <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Tìm kiếm
          </button>
        </form>
      </Card>

      {error && (
        <Card className="border-rose-200 text-sm text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
          <div className="flex items-center justify-between gap-3">
            <p>{error}</p>
            <button type="button" onClick={retry} className="font-semibold underline">Thử lại</button>
          </div>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-10"><LoadingSpinner message="Đang tải tài khoản..." /></div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Danh sách tài khoản chưa tải được.
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="Không tìm thấy tài khoản" description="Thử thay đổi từ khóa hoặc bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tên</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold">Điện thoại</th>
                    <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                  {users.map((user) => (
                    <tr key={user.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3 font-medium">{user.fullName || '—'}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                          {user.role === 'CANDIDATE' ? 'Candidate' : 'Recruiter'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{user.phone || '—'}</td>
                      <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-navy-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>{total.toLocaleString()} tài khoản</span>
              <div className="flex items-center gap-2">
                <span>Trang {page} / {Math.max(totalPages, 1)}</span>
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => current - 1);
                  }}
                  aria-label="Trang trước"
                  className="rounded border border-slate-200 p-1.5 disabled:opacity-40 dark:border-navy-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => current + 1);
                  }}
                  aria-label="Trang sau"
                  className="rounded border border-slate-200 p-1.5 disabled:opacity-40 dark:border-navy-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
