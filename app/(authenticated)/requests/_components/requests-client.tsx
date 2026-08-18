'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, ClipboardList, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function RequestsClient() {
  const { data: session } = useSession() || {};
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchRequests = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/requests?${params}`)
      .then(r => r.json())
      .then(d => setRequests(d ?? []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [search, statusFilter, typeFilter]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: '#FEF3C7', text: '#92400E' },
    APPROVED: { bg: '#DBEAFE', text: '#1E40AF' },
    SHIPPED: { bg: '#D1FAE5', text: '#065F46' },
    COMPLETED: { bg: '#D1FAE5', text: '#065F46' },
    CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Requests</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>View and manage equipment requests.</p>
        </div>
        <Link href="/catalog" className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>New Request</Link>
      </div>

      {/* Filters */}
      <div className="carters-card">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Search case number..." />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
            <option value="">All Types</option>
            <option value="NEW_STORE">New Store</option>
            <option value="REPLACEMENT">Replacement</option>
            <option value="SUPPORT">Support</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="carters-card overflow-x-auto">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (requests?.length ?? 0) === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>No requests found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F4F6FA' }}>
                <th className="text-left px-3 py-2 font-semibold">Case #</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Requester</th>
                <th className="text-left px-3 py-2 font-semibold">Store</th>
                <th className="text-left px-3 py-2 font-semibold">Items</th>
                <th className="text-left px-3 py-2 font-semibold">Priority</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-center px-3 py-2 font-semibold">View</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map?.((r: any) => {
                const sc = statusColors?.[r?.status] ?? { bg: '#F3F4F6', text: '#374151' };
                return (
                  <tr key={r?.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#E2E5EB' }}>
                    <td className="px-3 py-2 font-medium" style={{ color: '#0067B9' }}>{r?.caseNumber}</td>
                    <td className="px-3 py-2">{r?.type?.replace?.('_', ' ')}</td>
                    <td className="px-3 py-2">{r?.user?.name ?? r?.user?.email ?? 'N/A'}</td>
                    <td className="px-3 py-2">{r?.store?.siteNumber ?? 'N/A'}</td>
                    <td className="px-3 py-2">{r?.items?.length ?? 0}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${r?.priority === 'URGENT' ? 'text-red-600' : r?.priority === 'HIGH' ? 'text-orange-600' : 'text-gray-600'}`}>{r?.priority}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>{r?.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</td>
                    <td className="px-3 py-2 text-center">
                      <Link href={`/requests/${r?.id}`} className="p-1 inline-block rounded hover:bg-gray-200"><Eye className="w-4 h-4" style={{ color: '#0067B9' }} /></Link>
                    </td>
                  </tr>
                );
              }) ?? null}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
