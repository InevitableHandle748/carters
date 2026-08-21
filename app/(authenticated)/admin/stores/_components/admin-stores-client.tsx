'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdminStoresClient() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ siteNumber: '', name: '', address: '', city: '', state: '', zip: '', size: 'THREE_REGISTER', phone: '' });

  const fetchStores = () => { fetch('/api/stores').then(r => r.json()).then(d => setStores(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { fetchStores(); }, []);

  const openCreate = () => { setEditing(null); setForm({ siteNumber: '', name: '', address: '', city: '', state: '', zip: '', size: 'THREE_REGISTER', phone: '' }); setShowModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ siteNumber: s?.siteNumber ?? '', name: s?.name ?? '', address: s?.address ?? '', city: s?.city ?? '', state: s?.state ?? '', zip: s?.zip ?? '', size: s?.size ?? 'THREE_REGISTER', phone: s?.phone ?? '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const url = editing ? `/api/stores/${editing.id}` : '/api/stores';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(editing ? 'Store updated' : 'Store created'); setShowModal(false); fetchStores(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this store?')) return;
    try { const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchStores(); } } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Store Management</h1>
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}><Plus className="w-4 h-4" /> Add Store</button>
      </div>

      <div className="carters-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: '#F4F6FA' }}>
            <th className="text-left px-3 py-2 font-semibold">Site #</th>
            <th className="text-left px-3 py-2 font-semibold">Name</th>
            <th className="text-left px-3 py-2 font-semibold">Address</th>
            <th className="text-left px-3 py-2 font-semibold">Size</th>
            <th className="text-center px-3 py-2 font-semibold">Actions</th>
          </tr></thead>
          <tbody>
            {stores?.map?.((s: any) => (
              <tr key={s?.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                <td className="px-3 py-2 font-medium">{s?.siteNumber}</td>
                <td className="px-3 py-2">{s?.name}</td>
                <td className="px-3 py-2 text-gray-500">{s?.address}, {s?.city}, {s?.state} {s?.zip}</td>
                <td className="px-3 py-2">{s?.size}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-gray-200 mr-1"><Edit2 className="w-4 h-4" style={{ color: '#0067B9' }} /></button>
                  <button onClick={() => handleDelete(s?.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </td>
              </tr>
            )) ?? null}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold" style={{ color: '#171B25' }}>{editing ? 'Edit Store' : 'Add Store'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="carters-label block mb-1">Site Number</label><input type="text" value={form.siteNumber} onChange={e => setForm({...form, siteNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} disabled={!!editing} /></div>
              <div><label className="carters-label block mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="carters-label block mb-1">City</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
                <div><label className="carters-label block mb-1">State</label><input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
                <div><label className="carters-label block mb-1">ZIP</label><input type="text" value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              </div>
              <div><label className="carters-label block mb-1">Size</label>
                <select value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }}>
                  <option value="TWO_REGISTER">Small</option><option value="THREE_REGISTER">Medium</option><option value="FOUR_REGISTER">Large</option>
                </select>
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
