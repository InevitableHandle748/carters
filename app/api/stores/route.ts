export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams?.get?.('search') ?? '';

    const stores = await prisma.store.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { siteNumber: { contains: search } },
          { city: { contains: search } },
        ],
      } : {},
      orderBy: { siteNumber: 'asc' },
    });

    return NextResponse.json(stores?.map?.((s: any) => ({
      ...s,
      createdAt: s?.createdAt?.toISOString?.() ?? null,
      updatedAt: s?.updatedAt?.toISOString?.() ?? null,
    })) ?? []);
  } catch (error: any) {
    console.error('Stores API error:', error);
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'REQUESTER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const store = await prisma.store.create({ data: body });
    return NextResponse.json({ ...store, createdAt: store?.createdAt?.toISOString?.(), updatedAt: store?.updatedAt?.toISOString?.() });
  } catch (error: any) {
    console.error('Create store error:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
