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
    const storeSize = searchParams?.get?.('storeSize') ?? '';

    const where: any = { active: true };
    if (storeSize) where.storeSize = storeSize;

    const bundles = await prisma.bundle.findMany({
      where,
      include: {
        items: {
          include: { product: true },
          orderBy: { product: { category: 'asc' } },
        },
      },
    });

    return NextResponse.json(bundles?.map?.((b: any) => ({
      ...b,
      createdAt: b?.createdAt?.toISOString?.() ?? null,
      updatedAt: b?.updatedAt?.toISOString?.() ?? null,
      items: b?.items?.map?.((i: any) => ({
        ...i,
        product: {
          ...i?.product,
          createdAt: i?.product?.createdAt?.toISOString?.() ?? null,
          updatedAt: i?.product?.updatedAt?.toISOString?.() ?? null,
        },
      })) ?? [],
    })) ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load bundles' }, { status: 500 });
  }
}
