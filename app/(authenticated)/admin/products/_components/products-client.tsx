'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', category: '', unitPrice: 0, inStock: 0 });

  const fetchProducts = () => {
    fetch(`/api/products?search=${search}`).then(r => r.json()).then(d => setProducts(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', sku: '', description: '', category: '', unitPrice: 0, inStock: 0 }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p?.name ?? '', sku: p?.sku ?? '', description: p?.description ?? '', category: p?.category ?? '', unitPrice: p?.unitPrice ?? 0, inStock: p?.inStock ?? 0 }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice), inStock: Number(form.inStock) }) });
      if (res.ok) { toast.success(editing ? 'Product updated' : 'Product created'); setShowModal(false); fetchProducts(); }
      else { const d = await res.json(); toast.error(d?.error ?? 'Failed'); }
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try { const res = await fetch(`/api/products/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Product deactivated'); fetchProducts(); } } catch { toast.error('Error'); }
  };

  const categories = [...new Set((products ?? [])?.map?.((p: any) => p?.category)?.filter?.(Boolean) ?? [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Product Management</h1>
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}><Plus className="w-4 h-4" /> Add Product</button>
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
              <th className="text-right px-3 py-2 font-semibold">Stock</th>
              <th className="text-center px-3 py-2 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {products?.map?.((p: any) => (
                <tr key={p?.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                  <td className="px-3 py-2"><div className="font-medium">{p?.name}</div><div className="text-xs text-gray-500">{p?.description}</div></td>
                  <td className="px-3 py-2 font-mono text-xs">{p?.sku}</td>
                  <td className="px-3 py-2">{p?.category}</td>
                  <td className="px-3 py-2 text-right">${p?.unitPrice?.toFixed?.(2)}</td>
                  <td className="px-3 py-2 text-right">{p?.inStock}</td>
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
              <div className="grid grid-cols-2 gap-3">
                <div><label className="carters-label block mb-1">Unit Price</label><input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
                <div><label className="carters-label block mb-1">In Stock</label><input type="number" value={form.inStock} onChange={e => setForm({...form, inStock: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md text-sm" style={{ color: '#6B7280' }}>Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
