'use client';
import Link from 'next/link';
import { Store, Package, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';

const catalogItems = [
  {
    title: 'New Store Equipment Request',
    description: 'Order a complete equipment package for a new Carter\'s store. Select store size to auto-populate the recommended bundle, then customize as needed.',
    href: '/catalog/new-store',
    icon: Store,
    color: '#0067B9',
    article: '/knowledge',
  },
  {
    title: 'Request Replacement Item',
    description: 'Replace damaged or malfunctioning equipment at an existing store. Browse the stockroom inventory and select items with quantities.',
    href: '/catalog/replacement',
    icon: Package,
    color: '#00B2A9',
    article: '/knowledge',
  },
  {
    title: 'General Support Request',
    description: 'Submit a general IT support case for network issues, software help, account access, training, or other non-equipment requests.',
    href: '/catalog/support',
    icon: HelpCircle,
    color: '#F59E0B',
    article: '/knowledge',
  },
];

export function CatalogClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Service Catalog</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Select a catalog item to submit a new request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {catalogItems?.map?.((item: any) => {
          const Icon = item?.icon;
          return (
            <Link key={item?.href} href={item?.href} className="carters-card hover:shadow-lg transition-all group">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: item?.color }}>
                {Icon && <Icon className="w-7 h-7 text-white" />}
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#171B25' }}>{item?.title}</h3>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{item?.description}</p>
              <div className="flex items-center gap-1 text-sm font-medium" style={{ color: item?.color }}>
                Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        }) ?? null}
      </div>

      <div className="carters-card">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" style={{ color: '#0067B9' }} />
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#171B25' }}>Need help?</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>Visit the <Link href="/knowledge" className="underline" style={{ color: '#0067B9' }}>Knowledge Base</Link> for guides on each request type.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
