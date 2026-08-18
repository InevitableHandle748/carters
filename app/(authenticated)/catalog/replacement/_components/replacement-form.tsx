'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Minus, Trash2, ArrowLeft, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SelectedItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  installRequested: boolean;
}

export function ReplacementForm() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [installAll, setInstallAll] = useState(false);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(d => setStores(d ?? [])).catch(() => {});
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d ?? [])).catch(() => {});
  }, []);

  const filteredStores = (stores ?? [])?.filter?.((s: any) =>
    s?.name?.toLowerCase?.()?.includes?.(storeSearch?.toLowerCase?.() ?? '') ||
    s?.siteNumber?.toLowerCase?.()?.includes?.(storeSearch?.toLowerCase?.() ?? '')
  ) ?? [];

  const filteredProducts = (products ?? [])?.filter?.((p: any) =>
    p?.name?.toLowerCase?.()?.includes?.(productSearch?.toLowerCase?.() ?? '') ||
    p?.sku?.toLowerCase?.()?.includes?.(productSearch?.toLowerCase?.() ?? '')
  ) ?? [];

  const addProduct = (product: any) => {
    const existing = items?.findIndex?.((i: SelectedItem) => i?.productId === product?.id);
    if (existing >= 0) {
      setItems(prev => prev?.map?.((item: SelectedItem, idx: number) =>
        idx === existing ? { ...item, quantity: (item?.quantity ?? 0) + 1 } : item
      ) ?? []);
    } else {
      setItems(prev => [...(prev ?? []), {
        productId: product?.id,
        productName: product?.name ?? '',
        sku: product?.sku ?? '',
        category: product?.category ?? '',
        quantity: 1,
        installRequested: installAll,
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStore) { toast.error('Please select a store'); return; }
    if ((items?.length ?? 0) === 0) { toast.error('Please add at least one item'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REPLACEMENT',
          storeId: selectedStore?.id,
          installRequested: installAll,
          notes,
          priority,
          items: items?.map?.((i: SelectedItem) => ({
            productId: i?.productId,
            quantity: i?.quantity,
            installRequested: i?.installRequested,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${data?.caseNumber} created!`);
        router.push('/requests');
      } else {
        toast.error(data?.error ?? 'Failed to create request');
      }
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/catalog" className="p-2 hover:bg-white/50 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: '#6B7280' }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Request Replacement Item</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Select a store and add items from the stockroom.</p>
        </div>
      </div>

      {/* Store Selection */}
      <div className="carters-card">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#171B25' }}>Store Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="carters-label carters-required block mb-1">Store Location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={selectedStore ? `${selectedStore.siteNumber} - ${selectedStore.name}` : storeSearch}
                onChange={(e) => { setStoreSearch(e.target.value); setSelectedStore(null); }}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#E2E5EB' }}
                placeholder="Search by store name or site number..."
              />
              {storeSearch && !selectedStore && (filteredStores?.length ?? 0) > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredStores?.map?.((s: any) => (
                    <button key={s?.id} onClick={() => { setSelectedStore(s); setStoreSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0">
                      <span className="font-medium">{s?.siteNumber}</span> - {s?.name}
                    </button>
                  )) ?? null}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="carters-label carters-required block mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Search & Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Products */}
        <div className="carters-card">
          <h3 className="font-bold mb-3" style={{ color: '#171B25' }}>Available Products</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="Search products..."
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredProducts?.slice?.(0, 30)?.map?.((p: any) => (
              <button key={p?.id} onClick={() => addProduct(p)} className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm flex items-center justify-between group">
                <div>
                  <div className="font-medium">{p?.name}</div>
                  <div className="text-xs text-gray-500">{p?.sku} | {p?.category}</div>
                </div>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
              </button>
            )) ?? null}
          </div>
        </div>

        {/* Selected Items */}
        <div className="carters-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: '#171B25' }}>Selected Items ({items?.length ?? 0})</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={installAll} onChange={() => {
                const newVal = !installAll;
                setInstallAll(newVal);
                setItems(prev => prev?.map?.((i: SelectedItem) => ({ ...i, installRequested: newVal })) ?? []);
              }} style={{ accentColor: '#0067B9' }} />
              <Wrench className="w-4 h-4" style={{ color: '#0067B9' }} /> Install All
            </label>
          </div>
          {(items?.length ?? 0) === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>Click products from the left to add them.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {items?.map?.((item: SelectedItem, idx: number) => (
                <div key={item?.productId ?? idx} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: '#F5F3F0' }}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item?.productName}</div>
                    <div className="text-xs text-gray-500">{item?.sku}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={item?.installRequested ?? false} onChange={() => {
                      setItems(prev => prev?.map?.((i: SelectedItem, j: number) => j === idx ? { ...i, installRequested: !i?.installRequested } : i) ?? []);
                    }} style={{ accentColor: '#0067B9' }} title="Request Install" />
                    <button onClick={() => setItems(prev => prev?.map?.((i: SelectedItem, j: number) => j === idx ? { ...i, quantity: Math.max(1, (i?.quantity ?? 1) - 1) } : i) ?? [])} className="p-1 rounded hover:bg-gray-200"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-sm font-medium">{item?.quantity ?? 0}</span>
                    <button onClick={() => setItems(prev => prev?.map?.((i: SelectedItem, j: number) => j === idx ? { ...i, quantity: (i?.quantity ?? 0) + 1 } : i) ?? [])} className="p-1 rounded hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => setItems(prev => prev?.filter?.((_: SelectedItem, j: number) => j !== idx) ?? [])} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )) ?? null}
            </div>
          )}
        </div>
      </div>

      {/* Notes & Submit */}
      <div className="carters-card">
        <label className="carters-label block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm resize-none h-20" style={{ borderColor: '#E2E5EB' }} placeholder="Describe the issue or reason for replacement..." />
        <div className="flex justify-end gap-3 mt-4">
          <Link href="/catalog" className="px-6 py-2 rounded-md text-sm font-medium" style={{ color: '#6B7280' }}>Cancel</Link>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#0067B9' }}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
