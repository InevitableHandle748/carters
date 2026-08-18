'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export function ArticleDetailClient({ id }: { id: string }) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/knowledge/${id}`)
        .then(r => r.json())
        .then(d => setArticle(d))
        .catch(() => toast.error('Failed to load article'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="carters-card h-64 animate-pulse" />;
  if (!article) return <div className="carters-card text-center py-12"><p style={{ color: '#9CA3AF' }}>Article not found.</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/knowledge" className="p-2 hover:bg-white/50 rounded-md"><ArrowLeft className="w-5 h-5" style={{ color: '#6B7280' }} /></Link>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#0067B9' }}>{article?.category}</span>
          <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>{article?.title}</h1>
        </div>
      </div>

      <div className="carters-card">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: article?.content ?? '' }} />
      </div>
    </div>
  );
}
