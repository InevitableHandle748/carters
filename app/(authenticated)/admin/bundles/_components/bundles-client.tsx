'use client';
import { useState, useEffect } from 'react';
import { Layers, Package, Edit2, Upload, Plus, Trash2, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatStoreSize } from '@/lib/utils';

const STORE_SIZES = ['TWO_REGISTER', 'THREE_REGISTER', 'FOUR_REGISTER'];

// Minimal CSV parser that supports quoted fields and commas inside quotes.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v.trim() !== '')) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
}

const CSV_TEMPLATE =
  'sku,quantity,name,category,description,unitPrice,inStock\n' +
  'REG-001,2,Point of Sale Register,Registers,Standard checkout register,1200,10\n' +
  'SCN-100,2,Barcode Scanner,Peripherals,Handheld scanner,150,25\n' +
  'PRN-200,1,Receipt Printer,Peripherals,Thermal receipt printer,220,15\n';

export function BundlesClient() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editBundle, setEditBundle] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editItems, setEditItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSize, setUploadSize] = useState('TWO_REGISTER');
  const [uploadName, setUploadName] = useState('');
  const [createMissing, setCreateMissing] = useState(true);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const sizeColors: Record<string, string> = { TWO_REGISTER: '#F59E0B', THREE_REGISTER: '#0067B9', FOUR_REGISTER: '#00B2A9' };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/bundles').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([b, p]) => { setBundles(b ?? []); setProducts(p ?? []); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  // ---- Edit bundle ----
  const openEdit = (bundle: any) => {
    setEditBundle(bundle);
    setEditName(bundle?.name ?? '');
    setEditDescription(bundle?.description ?? '');
    setEditItems((bundle?.items ?? []).map((i: any) => ({ productId: i?.productId, quantity: i?.quantity ?? 1 })));
  };

  const addEditItem = () => {
    const used = new Set(editItems.map((i) => i.productId));
    const next = products.find((p) => !used.has(p.id));
    if (!next) { toast.error('All products are already in this bundle'); return; }
    setEditItems([...editItems, { productId: next.id, quantity: 1 }]);
  };
  const updateEditItem = (idx: number, patch: Partial<{ productId: string; quantity: number }>) => {
    setEditItems(editItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeEditItem = (idx: number) => setEditItems(editItems.filter((_, i) => i !== idx));

  const saveEdit = async () => {
    if (!editBundle) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bundles/${editBundle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          items: editItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 1 })),
        }),
      });
      if (res.ok) { toast.success('Bundle updated'); setEditBundle(null); fetchAll(); }
      else { const d = await res.json(); toast.error(d?.error ?? 'Failed to update'); }
    } catch { toast.error('Error updating bundle'); }
    finally { setSaving(false); }
  };

  // ---- CSV upload ----
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result ?? ''));
        if (!rows.length) { toast.error('No rows found in file'); setParsedRows([]); return; }
        if (!('sku' in rows[0]) || !('quantity' in rows[0])) {
          toast.error('CSV must include at least "sku" and "quantity" columns');
          setParsedRows([]); return;
        }
        setParsedRows(rows);
      } catch { toast.error('Could not parse file'); setParsedRows([]); }
    };
    reader.readAsText(file);
  };

  const knownSkus = new Set(products.map((p) => (p.sku ?? '').toLowerCase()));
  const previewStatus = (row: any) => {
    const sku = String(row?.sku ?? '').trim();
    if (!sku) return { label: 'Missing SKU', color: '#C0392B' };
    if (knownSkus.has(sku.toLowerCase())) return { label: 'Matched', color: '#00B2A9' };
    if (createMissing && row?.name && row?.category) return { label: 'New product', color: '#0067B9' };
    return { label: 'Will skip', color: '#C0392B' };
  };

  const submitUpload = async () => {
    if (!parsedRows.length) { toast.error('Please choose a CSV file first'); return; }
    setUploading(true);
    try {
      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSize: uploadSize,
          name: uploadName || undefined,
          createMissing,
          rows: parsedRows.map((r) => ({
            sku: r.sku,
            quantity: r.quantity,
            name: r.name,
            category: r.category,
            description: r.description,
            unitPrice: r.unitprice ?? r.unitPrice,
            inStock: r.instock ?? r.inStock,
          })),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`Bundle built: ${d?.itemsAdded ?? 0} items` + (d?.productsCreated?.length ? `, ${d.productsCreated.length} new product(s)` : ''));
        if (d?.skipped?.length) toast.warning(`${d.skipped.length} row(s) skipped`);
        setShowUpload(false); setParsedRows([]); setFileName(''); setUploadName('');
        fetchAll();
      } else {
        toast.error(d?.error ?? 'Failed to build bundle');
      }
    } catch { toast.error('Error uploading file'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bundle_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? 'Unknown product';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Bundle Management</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>View, edit, and upload equipment bundles for store sizes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium border" style={{ borderColor: '#E2E5EB', color: '#0067B9' }}>
            <Download className="w-4 h-4" /> CSV Template
          </button>
          <button onClick={() => { setShowUpload(true); setParsedRows([]); setFileName(''); }} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white/60 rounded-lg animate-pulse" />)}</div>
      ) : bundles.length === 0 ? (
        <div className="carters-card text-center py-12">
          <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
          <p className="font-medium" style={{ color: '#171B25' }}>No bundles yet</p>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Upload a CSV to build your first equipment bundle.</p>
          <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
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
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: sizeColors?.[bundle?.storeSize] ?? '#999' }}>{formatStoreSize(bundle?.storeSize)}</span>
                  <button onClick={() => openEdit(bundle)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border" style={{ borderColor: '#E2E5EB', color: '#0067B9' }}>
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                </div>
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

      {/* ---- Edit Bundle Modal ---- */}
      {editBundle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditBundle(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Edit {formatStoreSize(editBundle?.storeSize)} Bundle</h3>
              <button onClick={() => setEditBundle(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="carters-label block mb-1">Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Description</label><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm h-16" style={{ borderColor: '#E2E5EB' }} /></div>

              <div className="flex items-center justify-between pt-1">
                <label className="carters-label">Items ({editItems.length})</label>
                <button onClick={addEditItem} className="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium" style={{ color: '#0067B9' }}><Plus className="w-4 h-4" /> Add item</button>
              </div>
              <div className="space-y-2">
                {editItems.length === 0 && <p className="text-sm text-gray-500">No items. Click "Add item" to include products.</p>}
                {editItems.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select value={it.productId} onChange={(e) => updateEditItem(idx, { productId: e.target.value })} className="flex-1 px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                      {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
                    </select>
                    <input type="number" min={1} value={it.quantity} onChange={(e) => updateEditItem(idx, { quantity: parseInt(e.target.value) || 1 })} className="w-20 px-2 py-2 border rounded-md text-sm text-center" style={{ borderColor: '#E2E5EB' }} />
                    <button onClick={() => removeEditItem(idx)} className="p-2 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditBundle(null)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#0067B9' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Upload CSV Modal ---- */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Build Bundle from CSV</h3>
              <button onClick={() => setShowUpload(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="carters-label block mb-1">Target Store Size</label>
                  <select value={uploadSize} onChange={(e) => setUploadSize(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                    {STORE_SIZES.map((s) => (<option key={s} value={s}>{formatStoreSize(s)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="carters-label block mb-1">Bundle Name (optional)</label>
                  <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder={`${formatStoreSize(uploadSize)} Store Equipment Kit`} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} />
                </div>
              </div>

              <div className="rounded-md border-2 border-dashed p-4 text-center" style={{ borderColor: '#E2E5EB' }}>
                <input id="csv-file" type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <label htmlFor="csv-file" className="cursor-pointer inline-flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6" style={{ color: '#0067B9' }} />
                  <span className="text-sm font-medium" style={{ color: '#0067B9' }}>{fileName || 'Choose a CSV file'}</span>
                  <span className="text-xs text-gray-500">Required columns: sku, quantity. Optional: name, category, description, unitPrice, inStock</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm" style={{ color: '#171B25' }}>
                <input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />
                Auto-create products for unknown SKUs (requires name + category columns)
              </label>

              {parsedRows.length > 0 && (
                <div className="border rounded-md overflow-hidden" style={{ borderColor: '#E2E5EB' }}>
                  <div className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: '#F4F6FA', color: '#171B25' }}>Preview ({parsedRows.length} rows) — this will REPLACE the current {formatStoreSize(uploadSize)} bundle contents</div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ backgroundColor: '#FBFCFE' }}>
                        <th className="text-left px-3 py-2 font-semibold">SKU</th>
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-center px-3 py-2 font-semibold">Qty</th>
                        <th className="text-left px-3 py-2 font-semibold">Status</th>
                      </tr></thead>
                      <tbody>
                        {parsedRows.map((r, i) => {
                          const st = previewStatus(r);
                          return (
                            <tr key={i} className="border-b" style={{ borderColor: '#EEF1F6' }}>
                              <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                              <td className="px-3 py-2">{r.name || <span className="text-gray-400">—</span>}</td>
                              <td className="px-3 py-2 text-center">{r.quantity}</td>
                              <td className="px-3 py-2"><span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                <button onClick={submitUpload} disabled={uploading || parsedRows.length === 0} className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#0067B9' }}>{uploading ? 'Building…' : 'Build Bundle'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
