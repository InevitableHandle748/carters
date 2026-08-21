'use client';
import { useState, useEffect } from 'react';
import { Layers, Package } from 'lucide-react';
import { toast } from 'sonner';

export function BundlesClient() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bundles')
      .then(r => r.json())
      .then(d => setBundles(d ?? []))
      .catch(() => toast.error('Failed to load bundles'))
      .finally(() => setLoading(false));
  }, []);

  const sizeColors: Record<string, string> = { TWO_REGISTER: '#F59E0B', THREE_REGISTER: '#0067B9', FOUR_REGISTER: '#00B2A9' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Bundle Management</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>View and manage equipment bundles for store sizes.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-white/60 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {bundles?.map?.((bundle: any) => (
            <div key={bundle?.id} className="carters-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: sizeColors?.[bundle?.storeSize] ?? '#999' }}>
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold" style={{ color: '#171B25' }}>{bundle?.name}</h2>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{bundle?.description} • {bundle?.items?.length ?? 0} items</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: sizeColors?.[bundle?.storeSize] ?? '#999' }}>{bundle?.storeSize}</span>
              </div>

              <table className="w-full text-sm">
                <thead><tr style={{ backgroundColor: '#F4F6FA' }}>
                  <th className="text-left px-3 py-2 font-semibold">Product</th>
                  <th className="text-left px-3 py-2 font-semibold">SKU</th>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-center px-3 py-2 font-semibold">Quantity</th>
                </tr></thead>
                <tbody>
                  {bundle?.items?.map?.((item: any) => (
                    <tr key={item?.id} className="border-b" style={{ borderColor: '#E2E5EB' }}>
                      <td className="px-3 py-2 font-medium">{item?.product?.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{item?.product?.sku}</td>
                      <td className="px-3 py-2 text-gray-500">{item?.product?.category}</td>
                      <td className="px-3 py-2 text-center font-semibold">{item?.quantity}</td>
                    </tr>
                  )) ?? null}
                </tbody>
              </table>
            </div>
          )) ?? null}
        </div>
      )}
    </div>
  );
}
