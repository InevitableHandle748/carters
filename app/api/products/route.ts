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
    const category = searchParams?.get?.('category') ?? '';

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) where.category = category;

    const products = await prisma.product.findMany({ where, orderBy: { category: 'asc' } });
    return NextResponse.json(products?.map?.((p: any) => ({
      ...p,
      createdAt: p?.createdAt?.toISOString?.() ?? null,
      updatedAt: p?.updatedAt?.toISOString?.() ?? null,
    })) ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const product = await prisma.product.create({ data: body });
    return NextResponse.json({ ...product, createdAt: product?.createdAt?.toISOString?.(), updatedAt: product?.updatedAt?.toISOString?.() });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
