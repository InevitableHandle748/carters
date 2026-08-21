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

const VALID_SIZES = ['TWO_REGISTER', 'THREE_REGISTER', 'FOUR_REGISTER'];
const SIZE_LABELS: Record<string, string> = {
  TWO_REGISTER: '2 Register',
  THREE_REGISTER: '3 Register',
  FOUR_REGISTER: '4 Register',
};

// Build (create or replace) a bundle for a given store size from a set of
// rows. Each row identifies a product by SKU with a quantity. Rows whose SKU
// is unknown can auto-create a product when name + category are provided.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const storeSize = String(body?.storeSize ?? '');
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const createMissing = body?.createMissing !== false; // default: create unknown SKUs

    if (!VALID_SIZES.includes(storeSize)) {
      return NextResponse.json({ error: 'Invalid or missing storeSize' }, { status: 400 });
    }
    if (!rows.length) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const bundleName = body?.name || `${SIZE_LABELS[storeSize]} Store Equipment Kit`;
    const bundleDescription =
      body?.description ?? `Standard equipment bundle for ${SIZE_LABELS[storeSize]} stores`;

    // Aggregate rows by SKU (sum duplicate quantities).
    const bySku = new Map<string, { sku: string; quantity: number; meta: any }>();
    for (const r of rows) {
      const sku = String(r?.sku ?? '').trim();
      if (!sku) continue;
      const qty = Math.max(1, Number(r?.quantity) || 1);
      const existing = bySku.get(sku);
      if (existing) existing.quantity += qty;
      else bySku.set(sku, { sku, quantity: qty, meta: r });
    }

    const skus = [...bySku.keys()];
    const existingProducts = await prisma.product.findMany({ where: { sku: { in: skus } } });
    const productBySku = new Map(existingProducts.map((p: any) => [p.sku, p]));

    const created: string[] = [];
    const skipped: { sku: string; reason: string }[] = [];
    const resolved: { productId: string; quantity: number }[] = [];

    for (const [sku, row] of bySku) {
      let product: any = productBySku.get(sku);
      if (!product) {
        const name = String(row.meta?.name ?? '').trim();
        const category = String(row.meta?.category ?? '').trim();
        if (createMissing && name && category) {
          product = await prisma.product.create({
            data: {
              name,
              sku,
              category,
              description: row.meta?.description ? String(row.meta.description) : null,
              unitPrice: Number(row.meta?.unitPrice) || 0,
              inStock: Number(row.meta?.inStock) || 0,
            },
          });
          productBySku.set(sku, product);
          created.push(sku);
        } else {
          skipped.push({
            sku,
            reason: createMissing
              ? 'Unknown SKU (provide name + category columns to auto-create)'
              : 'Unknown SKU',
          });
          continue;
        }
      }
      resolved.push({ productId: product.id, quantity: row.quantity });
    }

    if (!resolved.length) {
      return NextResponse.json(
        { error: 'No valid products resolved from the file', skipped },
        { status: 400 },
      );
    }

    // Upsert the bundle for this store size (storeSize is unique) and replace
    // its items in one transaction.
    const bundle = await prisma.$transaction(async (tx) => {
      const existing = await tx.bundle.findUnique({ where: { storeSize: storeSize as any } });
      const b = existing
        ? await tx.bundle.update({
            where: { id: existing.id },
            data: { name: bundleName, description: bundleDescription, active: true },
          })
        : await tx.bundle.create({
            data: {
              name: bundleName,
              storeSize: storeSize as any,
              description: bundleDescription,
              active: true,
            },
          });
      await tx.bundleItem.deleteMany({ where: { bundleId: b.id } });
      await tx.bundleItem.createMany({
        data: resolved.map((r) => ({ bundleId: b.id, productId: r.productId, quantity: r.quantity })),
      });
      return b;
    });

    const full = await prisma.bundle.findUnique({
      where: { id: bundle.id },
      include: { items: { include: { product: true }, orderBy: { product: { category: 'asc' } } } },
    });

    return NextResponse.json({
      success: true,
      bundle: {
        ...full,
        createdAt: full?.createdAt?.toISOString?.() ?? null,
        updatedAt: full?.updatedAt?.toISOString?.() ?? null,
      },
      itemsAdded: resolved.length,
      productsCreated: created,
      skipped,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to build bundle' }, { status: 500 });
  }
}
