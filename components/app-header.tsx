'use client';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, ClipboardList, BookOpen, MapPin, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['REQUESTER', 'FULFILLER', 'ADMIN'] },
  { label: 'Catalog', href: '/catalog', icon: ShoppingCart, roles: ['REQUESTER', 'FULFILLER', 'ADMIN'] },
  { label: 'Requests', href: '/requests', icon: ClipboardList, roles: ['REQUESTER', 'FULFILLER', 'ADMIN'] },
  { label: 'Stores', href: '/stores', icon: MapPin, roles: ['REQUESTER', 'FULFILLER', 'ADMIN'] },
  { label: 'Knowledge', href: '/knowledge', icon: BookOpen, roles: ['REQUESTER', 'FULFILLER', 'ADMIN'] },
  { label: 'Admin', href: '/admin', icon: Settings, roles: ['ADMIN'] },
];

export function AppHeader() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = (session?.user as any)?.role ?? 'REQUESTER';
  const filteredNav = navItems?.filter?.((item: any) => item?.roles?.includes?.(role)) ?? [];

  return (
    <>
      {/* Gradient accent bar */}
      <div className="wachter-gradient-bar" />
      <header className="sticky top-0 z-50 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center wachter-gradient-bg">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>C</span>
            </div>
            <span className="font-bold text-base" style={{ color: '#171B25', fontFamily: 'Poppins, sans-serif' }}>
              Carter&apos;s Portal
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {filteredNav?.map?.((item: any) => {
              const Icon = item?.icon;
              const active = pathname?.startsWith?.(item?.href);
              return (
                <Link
                  key={item?.href}
                  href={item?.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    active
                      ? 'text-white'
                      : 'hover:bg-gray-50'
                  }`}
                  style={
                    active
                      ? { backgroundColor: '#0067B9', fontFamily: 'Poppins, sans-serif' }
                      : { color: '#3A3F4B', fontFamily: 'Poppins, sans-serif' }
                  }
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item?.label}
                </Link>
              );
            }) ?? null}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs" style={{ color: '#6B7280' }}>{session?.user?.name ?? session?.user?.email}</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00B2A9, #0067B9)' }}>
              {role}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1 text-sm transition-colors hover:text-red-600"
              style={{ color: '#6B7280' }}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1" style={{ borderColor: '#E2E5EB' }}>
            {filteredNav?.map?.((item: any) => {
              const Icon = item?.icon;
              const active = pathname?.startsWith?.(item?.href);
              return (
                <Link
                  key={item?.href}
                  href={item?.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    active ? 'text-white' : ''
                  }`}
                  style={
                    active
                      ? { backgroundColor: '#0067B9' }
                      : { color: '#3A3F4B' }
                  }
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item?.label}
                </Link>
              );
            }) ?? null}
            <div className="pt-2 border-t" style={{ borderColor: '#E2E5EB' }}>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
