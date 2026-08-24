'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const REQUIRED_COLUMNS = ['name', 'sku', 'category'];
const OPTIONAL_COLUMNS = ['description', 'unitPrice', 'active'];
const TEMPLATE_HEADERS = ['name', 'sku', 'description', 'category', 'unitPrice', 'active'];

// Minimal RFC-4180-ish CSV parser (handles quoted fields, embedded commas,
// escaped double-quotes and CRLF/LF line endings).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, ''); // strip BOM
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore, handled by \n */ }
      else field += c;
    }
  }
  // last field/row
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  // drop fully-empty trailing rows
  return rows.filter(r => r.some(cell => (cell ?? '').trim() !== ''));
}

type PreviewRow = { rowNumber: number; data: Record<string, string>; errors: string[] };

export function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', category: '', unitPrice: 0 });

  // CSV import state
  const [showImport, setShowImport] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [headerError, setHeaderError] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    fetch(`/api/products?search=${search}`).then(r => r.json()).then(d => setProducts(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', sku: '', description: '', category: '', unitPrice: 0 }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p?.name ?? '', sku: p?.sku ?? '', description: p?.description ?? '', category: p?.category ?? '', unitPrice: p?.unitPrice ?? 0 }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice) }) });
      if (res.ok) { toast.success(editing ? 'Product updated' : 'Product created'); setShowModal(false); fetchProducts(); }
      else { const d = await res.json(); toast.error(d?.error ?? 'Failed'); }
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try { const res = await fetch(`/api/products/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Product deactivated'); fetchProducts(); } } catch { toast.error('Error'); }
  };

  // ---------- CSV import helpers ----------
  const resetImport = () => {
    setCsvHeaders([]); setPreviewRows([]); setHeaderError(''); setImportResult(null); setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImport = () => { resetImport(); setShowImport(true); };
  const closeImport = () => { setShowImport(false); resetImport(); };

  const downloadTemplate = () => {
    const sample = 'Digital Signage Display,DSP-1001,55-inch 4K display,Displays,899.99,true';
    const csv = TEMPLATE_HEADERS.join(',') + '\n' + sample + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'product_import_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateRow = (data: Record<string, string>, sku: string, seen: Set<string>): string[] => {
    const errs: string[] = [];
    if (!String(data.name ?? '').trim()) errs.push('name is required');
    if (!sku) errs.push('sku is required');
    if (!String(data.category ?? '').trim()) errs.push('category is required');
    const priceRaw = String(data.unitPrice ?? '').trim();
    if (priceRaw !== '') {
      const n = Number(priceRaw);
      if (!Number.isFinite(n)) errs.push(`unitPrice "${priceRaw}" is not a number`);
      else if (n < 0) errs.push('unitPrice cannot be negative');
    }
    const activeRaw = String(data.active ?? '').trim().toLowerCase();
    if (activeRaw !== '' && !['true','false','1','0','yes','no','y','n'].includes(activeRaw)) {
      errs.push(`active "${activeRaw}" is not valid (use true or false)`);
    }
    if (sku) {
      if (seen.has(sku)) errs.push(`duplicate sku "${sku}" in file`);
      seen.add(sku);
    }
    return errs;
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const matrix = parseCsv(text);
        if (matrix.length === 0) { setHeaderError('The file is empty.'); setCsvHeaders([]); setPreviewRows([]); return; }
        const headers = matrix[0].map(h => (h ?? '').trim());
        const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
        if (missing.length > 0) {
          setHeaderError(`Missing required column(s): ${missing.join(', ')}. Required: ${REQUIRED_COLUMNS.join(', ')}.`);
          setCsvHeaders(headers); setPreviewRows([]); return;
        }
        setHeaderError('');
        setCsvHeaders(headers);
        const seen = new Set<string>();
        const dataRows: PreviewRow[] = matrix.slice(1).map((cells, idx) => {
          const data: Record<string, string> = {};
          headers.forEach((h, i) => { data[h] = (cells[i] ?? '').trim(); });
          const sku = String(data.sku ?? '').trim();
          const errors = validateRow(data, sku, seen);
          return { rowNumber: idx + 2, data, errors }; // +2: header is row 1
        });
        setPreviewRows(dataRows);
      } catch {
        setHeaderError('Could not read this file. Please make sure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  const validCount = previewRows.filter(r => r.errors.length === 0).length;
  const invalidCount = previewRows.length - validCount;

  const runImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: csvHeaders,
          rows: previewRows.map(r => ({ rowNumber: r.rowNumber, data: r.data })),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setImportResult(d);
        if (d.created > 0) { toast.success(`${d.created} product(s) imported`); fetchProducts(); }
        if (d.created === 0) toast.error('No products were imported');
      } else {
        toast.error(d?.error ?? 'Import failed');
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Product Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={openImport} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#00B2A9', color: '#fff' }}><Upload className="w-4 h-4" /> Upload CSV</button>
          <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      <div className="carters-card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Search products..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: '#F4F6FA' }}>
              <th className="text-left px-3 py-2 font-semibold">Name</th>
              <th className="text-left px-3 py-2 font-semibold">SKU</th>
              <th className="text-left px-3 py-2 font-semibold">Category</th>
              <th className="text-right px-3 py-2 font-semibold">Price</th>
              <th className="text-center px-3 py-2 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {products?.map?.((p: any) => (
                <tr key={p?.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                  <td className="px-3 py-2"><div className="font-medium">{p?.name}</div><div className="text-xs text-gray-500">{p?.description}</div></td>
                  <td className="px-3 py-2 font-mono text-xs">{p?.sku}</td>
                  <td className="px-3 py-2">{p?.category}</td>
                  <td className="px-3 py-2 text-right">${p?.unitPrice?.toFixed?.(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-gray-200 mr-1"><Edit2 className="w-4 h-4" style={{ color: '#0067B9' }} /></button>
                    <button onClick={() => handleDelete(p?.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              )) ?? null}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold" style={{ color: '#171B25' }}>{editing ? 'Edit Product' : 'Add Product'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="carters-label block mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">SKU</label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} disabled={!!editing} /></div>
              <div><label className="carters-label block mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm h-20" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Unit Price</label><input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeImport}>
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#171B25' }}>Import Products from CSV</h3>
              <button onClick={closeImport}><X className="w-5 h-5" /></button>
            </div>

            {/* Instructions + template */}
            <div className="rounded-md p-3 mb-4 text-sm" style={{ backgroundColor: '#F4F6FA', color: '#3A3F4B' }}>
              <p className="mb-2">Upload a CSV file with these columns. <strong>Required:</strong> {REQUIRED_COLUMNS.join(', ')}. <strong>Optional:</strong> {OPTIONAL_COLUMNS.join(', ')}.</p>
              <button onClick={downloadTemplate} className="inline-flex items-center gap-1 font-semibold" style={{ color: '#0067B9' }}><Download className="w-4 h-4" /> Download CSV template</button>
            </div>

            {!importResult && (
              <>
                <div className="mb-4">
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:text-white file:cursor-pointer" style={{ }} />
                  <style jsx>{`input::file-selector-button{background-color:#0067B9}`}</style>
                  {fileName && <p className="text-xs text-gray-500 mt-1">Selected: {fileName}</p>}
                </div>

                {headerError && (
                  <div className="flex items-start gap-2 rounded-md p-3 mb-4 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{headerError}</span>
                  </div>
                )}

                {previewRows.length > 0 && !headerError && (
                  <>
                    <div className="flex items-center gap-4 mb-2 text-sm">
                      <span className="inline-flex items-center gap-1" style={{ color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> {validCount} valid</span>
                      {invalidCount > 0 && <span className="inline-flex items-center gap-1" style={{ color: '#B91C1C' }}><AlertTriangle className="w-4 h-4" /> {invalidCount} with errors (will be skipped)</span>}
                    </div>
                    <div className="overflow-x-auto border rounded-md mb-4" style={{ borderColor: '#E2E5EB', maxHeight: '320px' }}>
                      <table className="w-full text-xs">
                        <thead className="sticky top-0"><tr style={{ backgroundColor: '#F4F6FA' }}>
                          <th className="text-left px-2 py-2 font-semibold">Row</th>
                          <th className="text-left px-2 py-2 font-semibold">Name</th>
                          <th className="text-left px-2 py-2 font-semibold">SKU</th>
                          <th className="text-left px-2 py-2 font-semibold">Category</th>
                          <th className="text-right px-2 py-2 font-semibold">Price</th>
                          <th className="text-left px-2 py-2 font-semibold">Status</th>
                        </tr></thead>
                        <tbody>
                          {previewRows.map(r => (
                            <tr key={r.rowNumber} className="border-t" style={{ borderColor: '#E2E5EB', backgroundColor: r.errors.length ? '#FEF2F2' : '#fff' }}>
                              <td className="px-2 py-1.5">{r.rowNumber}</td>
                              <td className="px-2 py-1.5">{r.data.name}</td>
                              <td className="px-2 py-1.5 font-mono">{r.data.sku}</td>
                              <td className="px-2 py-1.5">{r.data.category}</td>
                              <td className="px-2 py-1.5 text-right">{r.data.unitPrice}</td>
                              <td className="px-2 py-1.5">{r.errors.length === 0 ? <span style={{ color: '#059669' }}>Ready</span> : <span style={{ color: '#B91C1C' }}>{r.errors.join('; ')}</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={closeImport} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                  <button onClick={runImport} disabled={importing || validCount === 0 || !!headerError} className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#0067B9' }}>{importing ? 'Importing...' : `Import ${validCount} product(s)`}</button>
                </div>
              </>
            )}

            {importResult && (
              <div>
                <div className="rounded-md p-4 mb-4" style={{ backgroundColor: '#F0FDF4' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: '#059669' }}><CheckCircle2 className="w-5 h-5" /><span className="font-semibold">Import complete</span></div>
                  <p className="text-sm" style={{ color: '#3A3F4B' }}>{importResult.created} created &middot; {importResult.rejected} rejected &middot; {importResult.totalRows} total rows.</p>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="overflow-x-auto border rounded-md mb-4" style={{ borderColor: '#E2E5EB', maxHeight: '260px' }}>
                    <table className="w-full text-xs">
                      <thead className="sticky top-0"><tr style={{ backgroundColor: '#F4F6FA' }}>
                        <th className="text-left px-2 py-2 font-semibold">Row</th>
                        <th className="text-left px-2 py-2 font-semibold">SKU</th>
                        <th className="text-left px-2 py-2 font-semibold">Reason</th>
                      </tr></thead>
                      <tbody>
                        {importResult.errors.map((e: any, i: number) => (
                          <tr key={i} className="border-t" style={{ borderColor: '#E2E5EB' }}>
                            <td className="px-2 py-1.5">{e.row}</td>
                            <td className="px-2 py-1.5 font-mono">{e.sku}</td>
                            <td className="px-2 py-1.5" style={{ color: '#B91C1C' }}>{e.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { resetImport(); }} className="px-4 py-2 rounded-md text-sm font-semibold" style={{ color: '#0067B9' }}>Import another file</button>
                  <button onClick={closeImport} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
