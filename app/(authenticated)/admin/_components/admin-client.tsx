'use client';
import Link from 'next/link';
import { Users, Package, Layers, MapPin, BookOpen, ArrowRight } from 'lucide-react';

const adminSections = [
  { title: 'User Management', description: 'Create, edit, and manage user accounts and role assignments', href: '/admin/users', icon: Users, color: '#0067B9' },
  { title: 'Product Management', description: 'Add, edit, and manage equipment models in the catalog', href: '/admin/products', icon: Package, color: '#00B2A9' },
  { title: 'Bundle Management', description: 'Configure equipment bundles for 2, 3, and 4 Register stores', href: '/admin/bundles', icon: Layers, color: '#F59E0B' },
  { title: 'Store Management', description: 'Add and manage Carter\'s store locations', href: '/admin/stores', icon: MapPin, color: '#3B7DD8' },
  { title: 'Knowledge Articles', description: 'Create and manage knowledge base articles', href: '/admin/knowledge', icon: BookOpen, color: '#C0392B' },
];

export function AdminClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#171B25' }}>Administration</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Manage system configuration and data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections?.map?.((section: any) => {
          const Icon = section?.icon;
          return (
            <Link key={section?.href} href={section?.href} className="carters-card hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: section?.color }}>
                {Icon && <Icon className="w-6 h-6 text-white" />}
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: '#171B25' }}>{section?.title}</h3>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{section?.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: section?.color }}>
                Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        }) ?? null}
      </div>
    </div>
  );
}
