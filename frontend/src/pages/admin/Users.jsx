import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  vendor: 'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = (p = 1, s = search, r = roleFilter) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (s) params.search = s;
    if (r) params.role = r;
    adminApi.users(params)
      .then((res) => {
        setUsers(res.data || []);
        setPagination(res.pagination);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const toggleActive = async (user) => {
    try {
      const updated = await adminApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(user.is_active ? 'User disabled' : 'User enabled');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeRole = async (user, role) => {
    try {
      await adminApi.updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role } : u));
      toast.success(`Role changed to ${role}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1, search, roleFilter)}
            className="input max-w-xs"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); load(1, search, e.target.value); }}
            className="input w-auto"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
          </select>
          <button onClick={() => load(1)} className="btn-secondary text-sm">Search</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name || '—'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className={`badge border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                      >
                        <option value="customer">customer</option>
                        <option value="vendor">vendor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`text-xs font-medium px-2 py-1 rounded ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => load(p)}
                className={`w-8 h-8 rounded text-sm font-medium ${page === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
