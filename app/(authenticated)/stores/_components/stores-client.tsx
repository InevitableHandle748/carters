'use client';
import { useState, useEffect } from 'react';
import { Search, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function StoresClient() {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stores?search=${search}`)
      .then(r => r.json())
      .then(d => setStores(d ?? []))
      .catch(() => toast.error('Failed to load stores'))
      .finally(() => setLoading(false));
  }, [search]);

  const sizeColors: Record<string, string> = { TWO_REGISTER: '#F59E0B', THREE_REGISTER: '#0067B9', FOUR_REGISTER: '#00B2A9' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Store Locations</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Carter's Retail Inc. store directory.</p>
      </div>

      <div className="carters-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Search stores by name, site number, or city..." />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores?.map?.((s: any) => (
              <div key={s?.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow" style={{ borderColor: '#E2E5EB' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: '#0067B9' }} />
                    <span className="font-semibold text-sm">{s?.siteNumber}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: sizeColors?.[s?.size] ?? '#999' }}>{s?.size}</span>
                </div>
                <h3 className="font-medium text-sm mb-1" style={{ color: '#171B25' }}>{s?.name}</h3>
                <div className="flex items-start gap-1 text-xs" style={{ color: '#6B7280' }}>
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{s?.address}, {s?.city}, {s?.state} {s?.zip}</span>
                </div>
              </div>
            )) ?? null}
          </div>
        )}
      </div>
    </div>
  );
}
