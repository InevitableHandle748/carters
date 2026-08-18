'use client';
import { useState } from 'react';
import { ShieldAlert, Key, Lock, UserCog, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import Link from 'next/link';

export default function EmergencyAccessPage() {
  const [accessKey, setAccessKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Password reset state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const pwValidation = validatePassword(newPassword);
  const pwStrength = getPasswordStrength(newPassword);

  const handleAuthenticate = async () => {
    if (!accessKey.trim()) { toast.error('Enter the emergency access key'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/emergency-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey }),
      });
      const data = await res.json();
      if (res.ok && data?.authenticated) {
        setAuthenticated(true);
        setUsers(data.users ?? []);
        toast.success('Emergency access granted');
      } else {
        toast.error(data?.error ?? 'Invalid access key');
      }
    } catch { toast.error('Connection error'); }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;
    if (!pwValidation.valid) { toast.error('Password does not meet requirements'); return; }
    setResetting(true);
    try {
      const res = await fetch('/api/emergency-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey, action: 'reset-password', userId: resetUserId, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success(data.message);
        setResetUserId(null);
        setNewPassword('');
      } else {
        toast.error(data?.error ?? 'Failed to reset password');
      }
    } catch { toast.error('Error'); }
    setResetting(false);
  };

  const handlePromoteAdmin = async (userId: string) => {
    if (!confirm('Promote this user to Admin?')) return;
    try {
      const res = await fetch('/api/emergency-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey, action: 'promote-admin', userId }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        toast.success(data.message);
        // Refresh user list
        const listRes = await fetch('/api/emergency-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessKey, action: 'list' }),
        });
        const listData = await listRes.json();
        if (listData?.users) setUsers(listData.users);
      } else {
        toast.error(data?.error ?? 'Failed');
      }
    } catch { toast.error('Error'); }
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: '#FEE2E2', text: '#991B1B' },
    FULFILLER: { bg: '#DBEAFE', text: '#1E40AF' },
    REQUESTER: { bg: '#D1FAE5', text: '#065F46' },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#171B25' }}>
      {/* Warning bar */}
      <div className="py-2 px-4 text-center text-xs font-semibold text-white" style={{ backgroundColor: '#C0392B' }}>
        <ShieldAlert className="inline w-4 h-4 mr-1" /> EMERGENCY ACCESS — Authorized Personnel Only
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">

          {!authenticated ? (
            /* Key Entry */
            <div className="bg-white rounded-lg p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#FEE2E2' }}>
                  <Key className="w-7 h-7" style={{ color: '#991B1B' }} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#171B25', fontFamily: 'Poppins, sans-serif' }}>Emergency Access</h1>
                <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Enter the emergency access key to manage user accounts and reset passwords.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Emergency Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                      className="w-full pl-10 pr-10 py-2.5 border rounded-md text-sm font-mono"
                      style={{ borderColor: '#E2E5EB' }}
                      placeholder="Enter your emergency key"
                    />
                    <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showKey ? <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAuthenticate}
                  disabled={loading}
                  className="w-full py-3 rounded-md font-semibold text-white text-sm disabled:opacity-50 transition-all"
                  style={{ backgroundColor: '#C0392B', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.025em' }}
                >
                  {loading ? 'Verifying...' : 'Authenticate'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm inline-flex items-center gap-1" style={{ color: '#0067B9' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* User Management Panel */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <ShieldAlert className="inline w-5 h-5 mr-2" style={{ color: '#C0392B' }} />Emergency User Management
                </h1>
                <Link href="/login" className="text-sm px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: '#374151' }}>
                  <ArrowLeft className="inline w-3.5 h-3.5 mr-1" /> Exit
                </Link>
              </div>

              <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#F4F6FA' }}>
                      <th className="text-left px-4 py-3 font-semibold">User</th>
                      <th className="text-left px-4 py-3 font-semibold">Email</th>
                      <th className="text-center px-4 py-3 font-semibold">Role</th>
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => {
                      const rc = roleColors[user.role] ?? { bg: '#F3F4F6', text: '#374151' };
                      return (
                        <tr key={user.id} className="border-b" style={{ borderColor: '#E2E5EB' }}>
                          <td className="px-4 py-3 font-medium">{user.name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{user.email}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: rc.bg, color: rc.text }}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setResetUserId(user.id); setNewPassword(''); }}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-white"
                                style={{ backgroundColor: '#0067B9' }}
                              >
                                <Lock className="inline w-3 h-3 mr-0.5" /> Reset Password
                              </button>
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handlePromoteAdmin(user.id)}
                                  className="px-2.5 py-1 rounded text-xs font-semibold text-white"
                                  style={{ backgroundColor: '#C0392B' }}
                                >
                                  <UserCog className="inline w-3 h-3 mr-0.5" /> Make Admin
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Password Reset Modal */}
              {resetUserId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setResetUserId(null); setNewPassword(''); }}>
                  <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Reset Password</h3>
                      <button onClick={() => { setResetUserId(null); setNewPassword(''); }}><X className="w-5 h-5" style={{ color: '#6B7280' }} /></button>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                      Resetting password for <strong>{users.find((u: any) => u.id === resetUserId)?.email}</strong>
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm pr-10"
                            style={{ borderColor: newPassword.length > 0 && !pwValidation.valid ? '#F59E0B' : '#E2E5EB' }}
                            placeholder="Min 12 chars, upper, lower, number, special"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showPassword ? <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
                          </button>
                        </div>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pwStrength.percent}%`, backgroundColor: pwStrength.color }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {[
                              { test: newPassword.length >= 12, label: '12+ characters' },
                              { test: /[A-Z]/.test(newPassword), label: 'Uppercase' },
                              { test: /[a-z]/.test(newPassword), label: 'Lowercase' },
                              { test: /[0-9]/.test(newPassword), label: 'Number' },
                              { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword), label: 'Special char' },
                            ].map((rule) => (
                              <div key={rule.label} className="flex items-center gap-1.5">
                                {rule.test ? <Check className="w-3.5 h-3.5" style={{ color: '#00B2A9' }} /> : <X className="w-3.5 h-3.5" style={{ color: '#D1D5DB' }} />}
                                <span className="text-xs" style={{ color: rule.test ? '#00B2A9' : '#9CA3AF' }}>{rule.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => { setResetUserId(null); setNewPassword(''); }} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                        <button
                          onClick={handleResetPassword}
                          disabled={resetting || !pwValidation.valid}
                          className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
                          style={{ backgroundColor: '#C0392B' }}
                        >
                          {resetting ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
