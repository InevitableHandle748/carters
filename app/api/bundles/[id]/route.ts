export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function serializeBundle(b: any) {
  if (!b) return b;
  return {
    ...b,
    createdAt: b?.createdAt?.toISOString?.() ?? null,
    updatedAt: b?.updatedAt?.toISOString?.() ?? null,
    items: b?.items?.map?.((i: any) => ({
      ...i,
      product: i?.product
        ? {
            ...i.product,
            createdAt: i?.product?.createdAt?.toISOString?.() ?? null,
            updatedAt: i?.product?.updatedAt?.toISOString?.() ?? null,
          }
        : null,
    })) ?? [],
  };
}

// Update a bundle's metadata and (optionally) fully replace its items.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, description, active, items } = body ?? {};

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.bundle.update({ where: { id: params?.id }, data });
      }
      if (Array.isArray(items)) {
        // De-dupe by productId (schema enforces @@unique([bundleId, productId]))
        const seen = new Set<string>();
        const clean = items
          .filter((i: any) => i?.productId && !seen.has(i.productId) && seen.add(i.productId))
          .map((i: any) => ({
            bundleId: params?.id,
            productId: i.productId,
            quantity: Math.max(1, Number(i?.quantity) || 1),
          }));
        await tx.bundleItem.deleteMany({ where: { bundleId: params?.id } });
        if (clean.length) await tx.bundleItem.createMany({ data: clean });
      }
    });

    const bundle = await prisma.bundle.findUnique({
      where: { id: params?.id },
      include: { items: { include: { product: true }, orderBy: { product: { category: 'asc' } } } },
    });
    return NextResponse.json(serializeBundle(bundle));
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

// Delete a bundle (its items cascade via the schema relation).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await prisma.bundle.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
  }
}
