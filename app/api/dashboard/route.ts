export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any)?.role ?? 'REQUESTER';
    const userId = (session.user as any)?.id;

    const where = {};

    const [totalRequests, pendingRequests, approvedRequests, shippedRequests, completedRequests, cancelledRequests, recentRequests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.count({ where: { ...where, status: 'PENDING' } }),
      prisma.request.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.request.count({ where: { ...where, status: 'SHIPPED' } }),
      prisma.request.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.request.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.request.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, store: { select: { name: true, siteNumber: true } } },
      }),
    ]);

    let storeCount = 0;
    let productCount = 0;
    let userCount = 0;
    if (role === 'ADMIN') {
      [storeCount, productCount, userCount] = await Promise.all([
        prisma.store.count(),
        prisma.product.count(),
        prisma.user.count(),
      ]);
    }

    return NextResponse.json({
      stats: { totalRequests, pendingRequests, approvedRequests, shippedRequests, completedRequests, cancelledRequests, storeCount, productCount, userCount },
      recentRequests: recentRequests?.map?.((r: any) => ({
        ...r,
        createdAt: r?.createdAt?.toISOString?.() ?? null,
        updatedAt: r?.updatedAt?.toISOString?.() ?? null,
      })) ?? [],
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
