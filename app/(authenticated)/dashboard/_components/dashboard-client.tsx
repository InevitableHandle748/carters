'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ClipboardList, Clock, CheckCircle, Truck, XCircle, Store, Package, Users, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    shippedRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    storeCount: number;
    productCount: number;
    userCount: number;
  };
  recentRequests: any[];
}

export function DashboardClient() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const role = (session?.user as any)?.role ?? 'REQUESTER';

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/60 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = data?.stats;

  const statCards = [
    { label: 'Pending', value: stats?.pendingRequests ?? 0, icon: Clock, color: '#F59E0B' },
    { label: 'Approved', value: stats?.approvedRequests ?? 0, icon: CheckCircle, color: '#0067B9' },
    { label: 'Shipped', value: stats?.shippedRequests ?? 0, icon: Truck, color: '#00B2A9' },
    { label: 'Completed', value: stats?.completedRequests ?? 0, icon: CheckCircle, color: '#2E7D32' },
    { label: 'Cancelled', value: stats?.cancelledRequests ?? 0, icon: XCircle, color: '#C0392B' },
    { label: 'Total', value: stats?.totalRequests ?? 0, icon: BarChart3, color: '#171B25' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Welcome, {session?.user?.name ?? 'User'}</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          {role === 'ADMIN' ? 'System administration dashboard' : role === 'FULFILLER' ? 'Equipment fulfillment dashboard' : 'Equipment request dashboard'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/catalog/new-store" className="carters-card flex items-center gap-4 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0067B9' }}>
            <Store className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ color: '#171B25' }}>New Store Equipment</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>Order equipment for a new store</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>
        <Link href="/catalog/replacement" className="carters-card flex items-center gap-4 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00B2A9' }}>
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ color: '#171B25' }}>Replacement Item</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>Request replacement equipment</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>
        <Link href="/catalog/support" className="carters-card flex items-center gap-4 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ color: '#171B25' }}>General Support</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>Submit a support request</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards?.map?.((s: any) => {
          const Icon = s?.icon;
          return (
            <div key={s?.label} className="carters-card text-center">
              {Icon && <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: s?.color }} />}
              <div className="text-2xl font-bold" style={{ color: s?.color }}>{s?.value ?? 0}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{s?.label}</div>
            </div>
          );
        }) ?? null}
      </div>

      {/* Admin stats */}
      {role === 'ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="carters-card flex items-center gap-4">
            <Store className="w-8 h-8" style={{ color: '#0067B9' }} />
            <div>
              <div className="text-xl font-bold" style={{ color: '#171B25' }}>{stats?.storeCount ?? 0}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>Total Stores</div>
            </div>
          </div>
          <div className="carters-card flex items-center gap-4">
            <Package className="w-8 h-8" style={{ color: '#00B2A9' }} />
            <div>
              <div className="text-xl font-bold" style={{ color: '#171B25' }}>{stats?.productCount ?? 0}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>Products in Catalog</div>
            </div>
          </div>
          <div className="carters-card flex items-center gap-4">
            <Users className="w-8 h-8" style={{ color: '#F59E0B' }} />
            <div>
              <div className="text-xl font-bold" style={{ color: '#171B25' }}>{stats?.userCount ?? 0}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>Registered Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests */}
      <div className="carters-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#171B25' }}>Recent Requests</h2>
          <Link href="/requests" className="text-sm font-medium hover:underline" style={{ color: '#0067B9' }}>View All</Link>
        </div>
        {(data?.recentRequests?.length ?? 0) === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No requests yet. Create your first request from the catalog.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F4F6FA' }}>
                  <th className="text-left px-3 py-2 font-semibold">Case #</th>
                  <th className="text-left px-3 py-2 font-semibold">Type</th>
                  <th className="text-left px-3 py-2 font-semibold">Store</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-left px-3 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentRequests?.map?.((r: any) => (
                  <tr key={r?.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#E2E5EB' }}>
                    <td className="px-3 py-2">
                      <Link href={`/requests/${r?.id}`} className="font-medium hover:underline" style={{ color: '#0067B9' }}>{r?.caseNumber}</Link>
                    </td>
                    <td className="px-3 py-2">{r?.type?.replace?.('_', ' ')}</td>
                    <td className="px-3 py-2">{r?.store?.name ?? 'N/A'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r?.status} />
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const colors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: '#FEF3C7', text: '#92400E' },
    APPROVED: { bg: '#DBEAFE', text: '#1E40AF' },
    SHIPPED: { bg: '#D1FAE5', text: '#065F46' },
    COMPLETED: { bg: '#D1FAE5', text: '#065F46' },
    CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
  };
  const c = colors?.[status ?? ''] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {status ?? 'Unknown'}
    </span>
  );
}
