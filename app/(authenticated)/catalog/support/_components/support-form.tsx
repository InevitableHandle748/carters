'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function SupportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: '',
    priority: 'MEDIUM',
    description: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.category) { toast.error('Please select a category'); return; }
    if (!form.description) { toast.error('Please describe the issue'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUPPORT',
          category: form.category,
          priority: form.priority,
          description: form.description,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Support case ${data?.caseNumber} created!`);
        router.push('/requests');
      } else {
        toast.error(data?.error ?? 'Failed');
      }
    } catch {
      toast.error('Failed to submit');
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
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>General Support Request</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Submit a support case for non-equipment issues.</p>
        </div>
      </div>

      <div className="carters-card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="carters-label carters-required block mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
            >
              <option value="">Select a category...</option>
              <option value="Network">Network</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Account">Account Access</option>
              <option value="Training">Training</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="carters-label carters-required block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: '#E2E5EB' }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="carters-label carters-required block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm resize-none h-32"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div>
            <label className="carters-label block mb-1">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm resize-none h-20"
              style={{ borderColor: '#E2E5EB' }}
              placeholder="Any additional context..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/catalog" className="px-6 py-2 rounded-md text-sm font-medium" style={{ color: '#6B7280' }}>Cancel</Link>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#0067B9' }}>
              {loading ? 'Submitting...' : 'Submit Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
