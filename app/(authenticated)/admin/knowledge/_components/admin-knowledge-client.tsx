'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdminKnowledgeClient() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', slug: '', category: '', content: '', published: true });

  const fetchArticles = () => { fetch('/api/knowledge').then(r => r.json()).then(d => setArticles(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { fetchArticles(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', category: '', content: '', published: true }); setShowModal(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ title: a?.title ?? '', slug: a?.slug ?? '', category: a?.category ?? '', content: a?.content ?? '', published: a?.published ?? true }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const url = editing ? `/api/knowledge/${editing.id}` : '/api/knowledge';
      const method = editing ? 'PUT' : 'POST';
      const slug = form.slug || (form.title?.toLowerCase?.()?.replace?.(/[^a-z0-9]+/g, '-')?.replace?.(/^-|-$/g, '') ?? '');
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, slug }) });
      if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setShowModal(false); fetchArticles(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try { const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchArticles(); } } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Knowledge Articles</h1>
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: '#0067B9' }}><Plus className="w-4 h-4" /> New Article</button>
      </div>

      <div className="carters-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: '#F4F6FA' }}>
            <th className="text-left px-3 py-2 font-semibold">Title</th>
            <th className="text-left px-3 py-2 font-semibold">Category</th>
            <th className="text-left px-3 py-2 font-semibold">Published</th>
            <th className="text-center px-3 py-2 font-semibold">Actions</th>
          </tr></thead>
          <tbody>
            {articles?.map?.((a: any) => (
              <tr key={a?.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E2E5EB' }}>
                <td className="px-3 py-2 font-medium">{a?.title}</td>
                <td className="px-3 py-2">{a?.category}</td>
                <td className="px-3 py-2">{a?.published ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-gray-200 mr-1"><Edit2 className="w-4 h-4" style={{ color: '#0067B9' }} /></button>
                  <button onClick={() => handleDelete(a?.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </td>
              </tr>
            )) ?? null}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold" style={{ color: '#171B25' }}>{editing ? 'Edit Article' : 'New Article'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div><label className="carters-label block mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} /></div>
              <div><label className="carters-label block mb-1">Content (HTML)</label><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm h-48 font-mono" style={{ borderColor: '#E2E5EB' }} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} style={{ accentColor: '#0067B9' }} /> Published</label>
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
