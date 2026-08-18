import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './_components/login-form';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6FA' }}>
      {/* Gradient bar */}
      <div style={{ height: '4px', background: 'linear-gradient(135deg, #00B2A9 0%, #0067B9 100%)' }} />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, #00B2A9, #0067B9)' }}>
              <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>C</span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: '#171B25', fontFamily: 'Poppins, sans-serif' }}>Carter&apos;s Equipment Portal</h1>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Carter&apos;s Retail Inc. — Equipment Request Management</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
