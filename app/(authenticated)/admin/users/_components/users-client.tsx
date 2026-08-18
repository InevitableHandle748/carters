'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, X, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';

export function UsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'REQUESTER' });

  const fetchUsers = () => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'REQUESTER' }); setShowModal(true); };
  const openEdit = (user: any) => { setEditing(user); setForm({ name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'REQUESTER' }); setShowModal(true); };

  const pwValidation = useMemo(() => validatePassword(form.password), [form.password]);
  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const showPwFeedback = form.password.length > 0;
  const passwordRequired = !editing; // required for new users, optional for edits

  const handleSave = async () => {
    if (!editing && !form.password) {
      toast.error('Password is required');
      return;
    }
    if (form.password && !pwValidation.valid) {
      toast.error('Password does not meet complexity requirements');
      return;
    }
    try {
      const url = editing ? `/api/users/${editing.id}` : '/api/users';
      const method = editing ? 'PUT' : 'POST';
      const body: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast.success(editing ? 'User updated' : 'User created'); setShowModal(false); fetchUsers(); }
      else { const d = await res.json(); toast.error(d?.error ?? 'Failed'); }
    } catch { toast.error('Error saving user'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('User deleted'); fetchUsers(); } else toast.error('Failed');
    } catch { toast.error('Error'); }
  };

  const roleColors: Record<string, string> = { ADMIN: '#C0392B', FULFILLER: '#0067B9', REQUESTER: '#00B2A9' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>User Management</h1></div>
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="carters-card overflow-x-auto">
        {loading ? <div className="h-32 bg-gray-100 rounded animate-pulse" /> : (
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: '#F4F6FA' }}>
              <th className="text-left px-3 py-2 font-semibold">Name</th>
              <th className="text-left px-3 py-2 font-semibold">Email</th>
              <th className="text-left px-3 py-2 font-semibold">Role</th>
              <th className="text-left px-3 py-2 font-semibold">Created</th>
              <th className="text-center px-3 py-2 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {users?.map?.((u: any) => (
                <tr key={u?.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                  <td className="px-3 py-2 font-medium">{u?.name}</td>
                  <td className="px-3 py-2">{u?.email}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: roleColors?.[u?.role] ?? '#999' }}>{u?.role}</span></td>
                  <td className="px-3 py-2 text-gray-500">{u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-gray-200 mr-1"><Edit2 className="w-4 h-4" style={{ color: '#0067B9' }} /></button>
                    <button onClick={() => handleDelete(u?.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              )) ?? null}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>{editing ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="carters-label block mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div>
                <label className="carters-label block mb-1">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: showPwFeedback && !pwValidation.valid ? '#F59E0B' : '#E2E5EB' }} placeholder="Min 12 chars, upper, lower, number, special" />
                {showPwFeedback && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pwStrength.percent}%`, backgroundColor: pwStrength.color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {[
                        { test: form.password.length >= 12, label: '12+ characters' },
                        { test: /[A-Z]/.test(form.password), label: 'Uppercase' },
                        { test: /[a-z]/.test(form.password), label: 'Lowercase' },
                        { test: /[0-9]/.test(form.password), label: 'Number' },
                        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(form.password), label: 'Special char' },
                      ].map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1">
                          {rule.test ? <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#00B2A9' }} /> : <XIcon className="w-3 h-3 flex-shrink-0" style={{ color: '#D1D5DB' }} />}
                          <span className="text-xs" style={{ color: rule.test ? '#00B2A9' : '#9CA3AF' }}>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div><label className="carters-label block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                  <option value="REQUESTER">Requester</option><option value="FULFILLER">Fulfiller</option><option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
