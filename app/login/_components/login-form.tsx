'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E2E5EB' }}>
      <div className="flex items-center justify-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid #E2E5EB' }}>
        <LogIn className="w-5 h-5" style={{ color: '#0067B9' }} />
        <span className="font-semibold text-sm" style={{ color: '#171B25', fontFamily: 'Poppins, sans-serif' }}>Sign In to Your Account</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-10 pr-3 py-2.5 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="your.email@carters.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-10 pr-3 py-2.5 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="Enter your password"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md font-semibold text-white text-sm disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, #00B2A9, #0067B9)', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.025em' }}
        >
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
        Contact your administrator if you need an account.
      </p>
    </div>
  );
}
