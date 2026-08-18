import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { JWT } from 'next-auth/jwt';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth?.token as (JWT & { role?: string }) | null;
    const path = req.nextUrl?.pathname ?? '';
    
    // Admin routes
    if (path?.startsWith?.('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // Fulfiller routes
    if (path?.startsWith?.('/fulfill') && token?.role !== 'FULFILLER' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }: { token: JWT | null }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/requests/:path*', '/catalog/:path*', '/admin/:path*', '/fulfill/:path*', '/knowledge/:path*', '/stores/:path*'],
};
