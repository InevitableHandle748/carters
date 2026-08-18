'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function KnowledgeClient() {
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/knowledge?search=${search}`)
      .then(r => r.json())
      .then(d => setArticles(d ?? []))
      .catch(() => toast.error('Failed to load articles'))
      .finally(() => setLoading(false));
  }, [search]);

  const categories = [...new Set((articles ?? [])?.map?.((a: any) => a?.category)?.filter?.(Boolean) ?? [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Knowledge Base</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Guides and documentation for equipment requests and processes.</p>
      </div>

      <div className="carters-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm" style={{ borderColor: '#E2E5EB' }} placeholder="Search articles..." />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/60 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {categories?.map?.((cat: string) => (
            <div key={cat}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#0067B9' }}>{cat}</h2>
              <div className="space-y-2">
                {articles?.filter?.((a: any) => a?.category === cat)?.map?.((article: any) => (
                  <Link key={article?.id} href={`/knowledge/${article?.id}`} className="carters-card flex items-center justify-between hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5" style={{ color: '#0067B9' }} />
                      <div>
                        <h3 className="font-medium text-sm" style={{ color: '#171B25' }}>{article?.title}</h3>
                        <p className="text-xs" style={{ color: '#6B7280' }}>Updated {article?.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                )) ?? null}
              </div>
            </div>
          )) ?? null}
        </div>
      )}
    </div>
  );
}
