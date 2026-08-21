'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, Search, Plus, Minus, Trash2, ArrowLeft, Package, Wrench, MapPin, Globe, Building2, X, Paperclip, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface StoreOption {
  id: string;
  siteNumber: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  size: string;
}

interface BundleItem {
  productId: string;
  productName: string;
  sku: string;
  description: string | null;
  category: string;
  quantity: number;
  installRequested: boolean;
}

const NOTES_TEMPLATE = `Site Survey: \nIT Install Week: `;

const MAX_ATTACHMENTS = 2;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const formatBytes = (b: number) => b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

export function NewStoreForm() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [storeSize, setStoreSize] = useState('');
  const [items, setItems] = useState<BundleItem[]>([]);
  const [installAll, setInstallAll] = useState(false);
  const [notes, setNotes] = useState(NOTES_TEMPLATE);
  const [ipAddress, setIpAddress] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Drop ship
  const [enableDropShip, setEnableDropShip] = useState(false);
  const [dropShipStore, setDropShipStore] = useState<StoreOption | null>(null);
  const [dropShipSearch, setDropShipSearch] = useState('');

  // Create store modal
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStore, setNewStore] = useState({ siteNumber: '', name: '', address: '', city: '', state: '', zip: '', size: 'THREE_REGISTER' as string, phone: '' });
  const [creatingStore, setCreatingStore] = useState(false);

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(d => setStores(d ?? [])).catch(() => {});
    fetch('/api/products').then(r => r.json()).then(d => setAllProducts(d ?? [])).catch(() => {});
  }, []);

  const filteredStores = (stores ?? [])?.filter?.((s: StoreOption) =>
    s?.name?.toLowerCase?.()?.includes?.(storeSearch?.toLowerCase?.() ?? '') ||
    s?.siteNumber?.toLowerCase?.()?.includes?.(storeSearch?.toLowerCase?.() ?? '')
  ) ?? [];

  const filteredDropShipStores = (stores ?? [])?.filter?.((s: StoreOption) =>
    s?.id !== selectedStore?.id &&
    (s?.name?.toLowerCase?.()?.includes?.(dropShipSearch?.toLowerCase?.() ?? '') ||
    s?.siteNumber?.toLowerCase?.()?.includes?.(dropShipSearch?.toLowerCase?.() ?? ''))
  ) ?? [];

  const handleStoreSelect = (store: StoreOption) => {
    setSelectedStore(store);
    setStoreSize(store?.size ?? '');
    setStoreSearch('');
    loadBundle(store?.size ?? '');
  };

  const loadBundle = async (size: string) => {
    if (!size) return;
    try {
      const res = await fetch(`/api/bundles?storeSize=${size}`);
      const bundles = await res.json();
      const bundle = bundles?.[0];
      if (bundle?.items) {
        setItems(bundle.items?.map?.((bi: any) => ({
          productId: bi?.product?.id ?? bi?.productId,
          productName: bi?.product?.name ?? '',
          sku: bi?.product?.sku ?? '',
          description: bi?.product?.description ?? null,
          category: bi?.product?.category ?? '',
          quantity: bi?.quantity ?? 1,
          installRequested: false,
        })) ?? []);
      }
    } catch {
      toast.error('Failed to load bundle');
    }
  };

  const handleSizeChange = (size: string) => {
    setStoreSize(size);
    loadBundle(size);
  };

  const updateQuantity = (idx: number, delta: number) => {
    setItems(prev => prev?.map?.((item: BundleItem, i: number) =>
      i === idx ? { ...item, quantity: Math.max(0, (item?.quantity ?? 0) + delta) } : item
    )?.filter?.((item: BundleItem) => (item?.quantity ?? 0) > 0) ?? []);
  };

  const toggleInstall = (idx: number) => {
    setItems(prev => prev?.map?.((item: BundleItem, i: number) =>
      i === idx ? { ...item, installRequested: !item?.installRequested } : item
    ) ?? []);
  };

  const toggleInstallAll = () => {
    const newVal = !installAll;
    setInstallAll(newVal);
    setItems(prev => prev?.map?.((item: BundleItem) => ({ ...item, installRequested: newVal })) ?? []);
  };

  const addProduct = (product: any) => {
    const existing = items?.findIndex?.((i: BundleItem) => i?.productId === product?.id);
    if (existing >= 0) {
      updateQuantity(existing, 1);
    } else {
      setItems(prev => [...(prev ?? []), {
        productId: product?.id,
        productName: product?.name ?? '',
        sku: product?.sku ?? '',
        description: product?.description ?? null,
        category: product?.category ?? '',
        quantity: 1,
        installRequested: installAll,
      }]);
    }
    setShowAddItem(false);
    setProductSearch('');
  };

  const handleCreateStore = async () => {
    if (!newStore.siteNumber || !newStore.name || !newStore.address || !newStore.city || !newStore.state || !newStore.zip) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreatingStore(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
      if (res.ok) {
        const created = await res.json();
        setStores(prev => [...prev, created]);
        handleStoreSelect(created);
        setShowCreateStore(false);
        setNewStore({ siteNumber: '', name: '', address: '', city: '', state: '', zip: '', size: 'THREE_REGISTER', phone: '' });
        toast.success('Store created successfully');
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed to create store');
      }
    } catch {
      toast.error('Failed to create store');
    }
    setCreatingStore(false);
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    for (const f of incoming) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not allowed. Only PDF, JPG, and PNG.`);
        continue;
      }
      if (f.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`"${f.name}" exceeds the 5MB limit.`);
        continue;
      }
      accepted.push(f);
    }
    setAttachments(prev => {
      const combined = [...prev, ...accepted];
      if (combined.length > MAX_ATTACHMENTS) {
        toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
        return combined.slice(0, MAX_ATTACHMENTS);
      }
      return combined;
    });
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedStore) { toast.error('Please select a store'); return; }
    if (!storeSize) { toast.error('Please select a store size'); return; }
    if ((items?.length ?? 0) === 0) { toast.error('Please add at least one item'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_STORE',
          storeId: selectedStore?.id,
          storeSize,
          installRequested: installAll,
          notes,
          ipAddress: ipAddress || undefined,
          dropShipStoreId: enableDropShip && dropShipStore ? dropShipStore.id : undefined,
          priority: 'MEDIUM',
          items: items?.map?.((i: BundleItem) => ({
            productId: i?.productId,
            quantity: i?.quantity,
            installRequested: i?.installRequested,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Upload attachments (if any) to the newly created request
        if (attachments.length > 0 && data?.id) {
          try {
            const fd = new FormData();
            attachments.forEach(f => fd.append('files', f));
            const upRes = await fetch(`/api/requests/${data.id}/attachments`, { method: 'POST', body: fd });
            if (!upRes.ok) {
              const upErr = await upRes.json().catch(() => ({}));
              toast.error(`Request created, but attachments failed: ${upErr?.error ?? 'upload error'}`);
            }
          } catch {
            toast.error('Request created, but attachments failed to upload.');
          }
        }
        toast.success(`Request ${data?.caseNumber} created successfully!`);
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

  const filteredProducts = (allProducts ?? [])?.filter?.((p: any) =>
    (p?.name?.toLowerCase?.()?.includes?.(productSearch?.toLowerCase?.() ?? '') ||
    p?.sku?.toLowerCase?.()?.includes?.(productSearch?.toLowerCase?.() ?? '')) &&
    !items?.some?.((i: BundleItem) => i?.productId === p?.id)
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/catalog" className="p-2 hover:bg-white/50 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: '#6B7280' }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>New Store Equipment Request</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Select a store and review the equipment bundle.</p>
        </div>
      </div>

      {/* Store Selection */}
      <div className="carters-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#171B25' }}>Store Information</h2>
          <button
            onClick={() => setShowCreateStore(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: '#00B2A9' }}
          >
            <Building2 className="w-4 h-4" /> Create New Store
          </button>
        </div>
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
                  {filteredStores?.map?.((s: StoreOption) => (
                    <button
                      key={s?.id}
                      onClick={() => handleStoreSelect(s)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                    >
                      <span className="font-medium">{s?.siteNumber}</span> - {s?.name}
                      <br />
                      <span className="text-xs text-gray-500">{s?.address}, {s?.city}, {s?.state} {s?.zip}</span>
                    </button>
                  )) ?? null}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="carters-label carters-required block mb-1">Store Size</label>
            <select
              value={storeSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E2E5EB' }}
            >
              <option value="">Select store size...</option>
              <option value="TWO_REGISTER">2 Register (Under 3,000 sq ft)</option>
              <option value="THREE_REGISTER">3 Register (3,000-6,000 sq ft)</option>
              <option value="FOUR_REGISTER">4 Register (Over 6,000 sq ft)</option>
            </select>
          </div>
        </div>
        {selectedStore && (
          <div className="mt-3 p-3 rounded-md" style={{ backgroundColor: '#F5F3F0' }}>
            <p className="text-sm"><strong>Address:</strong> {selectedStore?.address}, {selectedStore?.city}, {selectedStore?.state} {selectedStore?.zip}</p>
          </div>
        )}
      </div>

      {/* IP Address */}
      <div className="carters-card">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#171B25' }}>
          <Globe className="inline w-5 h-5 mr-2" style={{ color: '#0067B9' }} />
          Network Configuration
        </h2>
        <div>
          <label className="carters-label block mb-1">IP Address</label>
          <input
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#E2E5EB' }}
            placeholder="e.g. 192.168.1.100"
          />
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>IP address assigned to this store location.</p>
        </div>
      </div>

      {/* Drop Ship Option */}
      <div className="carters-card">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#171B25' }}>
          <MapPin className="inline w-5 h-5 mr-2" style={{ color: '#0067B9' }} />
          Shipping Destination
        </h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={enableDropShip}
            onChange={(e) => { setEnableDropShip(e.target.checked); if (!e.target.checked) setDropShipStore(null); }}
            className="rounded"
            style={{ accentColor: '#0067B9' }}
          />
          Ship to a different store address (Drop Ship)
        </label>
        {enableDropShip && (
          <div>
            <label className="carters-label carters-required block mb-1">Drop Ship Store Location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={dropShipStore ? `${dropShipStore.siteNumber} - ${dropShipStore.name}` : dropShipSearch}
                onChange={(e) => { setDropShipSearch(e.target.value); setDropShipStore(null); }}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#E2E5EB' }}
                placeholder="Search drop ship store..."
              />
              {dropShipSearch && !dropShipStore && (filteredDropShipStores?.length ?? 0) > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredDropShipStores?.map?.((s: StoreOption) => (
                    <button
                      key={s?.id}
                      onClick={() => { setDropShipStore(s); setDropShipSearch(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                    >
                      <span className="font-medium">{s?.siteNumber}</span> - {s?.name}
                      <br />
                      <span className="text-xs text-gray-500">{s?.address}, {s?.city}, {s?.state} {s?.zip}</span>
                    </button>
                  )) ?? null}
                </div>
              )}
            </div>
            {dropShipStore && (
              <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: '#F5F3F0' }}>
                <p className="text-sm"><strong>Drop Ship To:</strong> {dropShipStore.address}, {dropShipStore.city}, {dropShipStore.state} {dropShipStore.zip}</p>
              </div>
            )}
          </div>
        )}
        {!enableDropShip && selectedStore && (
          <p className="text-sm" style={{ color: '#6B7280' }}>Equipment will be shipped to the selected store address.</p>
        )}
      </div>

      {/* Equipment List */}
      {(items?.length ?? 0) > 0 && (
        <div className="carters-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#171B25' }}>
              <Package className="inline w-5 h-5 mr-2" style={{ color: '#0067B9' }} />
              Equipment List ({items?.length ?? 0} items)
            </h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={installAll} onChange={toggleInstallAll} className="rounded" style={{ accentColor: '#0067B9' }} />
                <Wrench className="w-4 h-4" style={{ color: '#0067B9' }} />
                Request Install (All)
              </label>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: '#0067B9' }}
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F4F6FA' }}>
                  <th className="text-left px-3 py-2 font-semibold">Item</th>
                  <th className="text-left px-3 py-2 font-semibold">SKU</th>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-center px-3 py-2 font-semibold">Qty</th>
                  <th className="text-center px-3 py-2 font-semibold">Install</th>
                  <th className="text-center px-3 py-2 font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items?.map?.((item: BundleItem, idx: number) => (
                  <tr key={item?.productId ?? idx} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{item?.productName}</div>
                      {item?.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{item?.sku}</td>
                    <td className="px-3 py-2 text-gray-500">{item?.category}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQuantity(idx, -1)} className="p-1 rounded hover:bg-gray-200"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center font-medium">{item?.quantity ?? 0}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="p-1 rounded hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item?.installRequested ?? false}
                        onChange={() => toggleInstall(idx)}
                        style={{ accentColor: '#0067B9' }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => setItems(prev => prev?.filter?.((_: BundleItem, i: number) => i !== idx) ?? [])} className="p-1 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddItem(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3" style={{ color: '#171B25' }}>Add Item from Stockroom</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                placeholder="Search products..."
                autoFocus
              />
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredProducts?.slice?.(0, 20)?.map?.((p: any) => (
                <button
                  key={p?.id}
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm border-b"
                >
                  <div className="font-medium">{p?.name}</div>
                  <div className="text-xs text-gray-500">{p?.sku} | {p?.category} | ${p?.unitPrice?.toFixed?.(2)}</div>
                </button>
              )) ?? null}
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      {showCreateStore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateStore(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E2E5EB' }}>
              <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Create New Store</h3>
              <button onClick={() => setShowCreateStore(false)}><X className="w-5 h-5" style={{ color: '#6B7280' }} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Site Number *</label>
                  <input type="text" value={newStore.siteNumber} onChange={e => setNewStore(p => ({ ...p, siteNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="e.g. S-1234" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Store Name *</label>
                  <input type="text" value={newStore.name} onChange={e => setNewStore(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Store name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Address *</label>
                <input type="text" value={newStore.address} onChange={e => setNewStore(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>City *</label>
                  <input type="text" value={newStore.city} onChange={e => setNewStore(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>State *</label>
                  <input type="text" value={newStore.state} onChange={e => setNewStore(p => ({ ...p, state: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>ZIP *</label>
                  <input type="text" value={newStore.zip} onChange={e => setNewStore(p => ({ ...p, zip: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Store Size *</label>
                  <select value={newStore.size} onChange={e => setNewStore(p => ({ ...p, size: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                    <option value="TWO_REGISTER">2 Register</option>
                    <option value="THREE_REGISTER">3 Register</option>
                    <option value="FOUR_REGISTER">4 Register</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#171B25' }}>Phone</label>
                  <input type="text" value={newStore.phone} onChange={e => setNewStore(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="(optional)" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2" style={{ borderColor: '#E2E5EB' }}>
              <button onClick={() => setShowCreateStore(false)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
              <button onClick={handleCreateStore} disabled={creatingStore} className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#00B2A9' }}>
                {creatingStore ? 'Creating...' : 'Create Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      <div className="carters-card">
        <h2 className="text-lg font-bold mb-1" style={{ color: '#171B25' }}>
          <Paperclip className="inline w-5 h-5 mr-2" style={{ color: '#0067B9' }} />
          Attachments
        </h2>
        <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
          Attach up to {MAX_ATTACHMENTS} files (PDF, JPG, or PNG — max 5MB each).
        </p>

        {attachments.length > 0 && (
          <div className="space-y-2 mb-3">
            {attachments.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-md border" style={{ borderColor: '#E2E5EB', backgroundColor: '#F5F3F0' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#0067B9' }} />
                  <span className="text-sm truncate">{f.name}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>({formatBytes(f.size)})</span>
                </div>
                <button onClick={() => removeAttachment(idx)} className="p-1 rounded hover:bg-red-50 text-red-500 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachments.length < MAX_ATTACHMENTS && (
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer border" style={{ borderColor: '#0067B9', color: '#0067B9' }}>
            <Plus className="w-4 h-4" /> Add File
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
            />
          </label>
        )}
      </div>

      {/* Notes & Submit */}
      <div className="carters-card">
        <label className="carters-label block mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm resize-none h-28 focus:outline-none focus:ring-2"
          style={{ borderColor: '#E2E5EB' }}
          placeholder="Any additional instructions or notes..."
        />
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Template pre-filled with Site Survey and IT Install Week fields.</p>
        <div className="flex justify-end gap-3 mt-4">
          <Link href="/catalog" className="px-6 py-2 rounded-md text-sm font-medium" style={{ color: '#6B7280' }}>Cancel</Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#0067B9' }}
          >
            {loading ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
