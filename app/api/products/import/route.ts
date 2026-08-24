export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Required + optional columns for the CSV import. `inStock` is intentionally NOT
// part of the import surface (it is no longer shown in the UI); new products
// fall back to the schema default (0).
const REQUIRED_COLUMNS = ['name', 'sku', 'category'];

function parseBoolean(raw: string): boolean | null {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === '' ) return true; // default active
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return null; // invalid
}

type IncomingRow = { rowNumber: number; data: Record<string, string> };

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const headers: string[] = Array.isArray(body?.headers) ? body.headers.map((h: any) => String(h ?? '').trim()) : [];
    const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : [];

    // Header validation
    const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Missing required column(s): ${missing.join(', ')}. Required columns are: ${REQUIRED_COLUMNS.join(', ')}.`,
      }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the file.' }, { status: 400 });
    }

    // Existing SKUs in DB (for duplicate detection)
    const skusInFile = rows
      .map(r => String(r?.data?.sku ?? '').trim())
      .filter(Boolean);
    const existing = await prisma.product.findMany({
      where: { sku: { in: skusInFile } },
      select: { sku: true },
    });
    const existingSkus = new Set(existing.map(e => e.sku));

    const seenSkus = new Set<string>();
    const errors: { row: number; sku: string; reason: string }[] = [];
    const toCreate: { row: number; data: any }[] = [];

    for (const r of rows) {
      const rowNum = r?.rowNumber;
      const d = r?.data ?? {};
      const name = String(d.name ?? '').trim();
      const sku = String(d.sku ?? '').trim();
      const category = String(d.category ?? '').trim();
      const description = String(d.description ?? '').trim();
      const unitPriceRaw = String(d.unitPrice ?? '').trim();
      const activeRaw = String(d.active ?? '').trim();

      const rowErrors: string[] = [];

      if (!name) rowErrors.push('name is required');
      if (!sku) rowErrors.push('sku is required');
      if (!category) rowErrors.push('category is required');

      let unitPrice = 0;
      if (unitPriceRaw !== '') {
        const n = Number(unitPriceRaw);
        if (!Number.isFinite(n)) rowErrors.push(`unitPrice "${unitPriceRaw}" is not a valid number`);
        else if (n < 0) rowErrors.push('unitPrice cannot be negative');
        else unitPrice = n;
      }

      const active = parseBoolean(activeRaw);
      if (active === null) rowErrors.push(`active "${activeRaw}" is not valid (use true or false)`);

      // Duplicate SKU checks
      if (sku) {
        if (seenSkus.has(sku)) rowErrors.push(`duplicate sku "${sku}" appears more than once in the file`);
        else if (existingSkus.has(sku)) rowErrors.push(`sku "${sku}" already exists and was skipped`);
        seenSkus.add(sku);
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, sku, reason: rowErrors.join('; ') });
        continue;
      }

      toCreate.push({
        row: rowNum,
        data: { name, sku, category, description: description || null, unitPrice, active: active ?? true },
      });
    }

    // Import valid rows
    let created = 0;
    for (const item of toCreate) {
      try {
        await prisma.product.create({ data: item.data });
        created++;
      } catch (e: any) {
        errors.push({ row: item.row, sku: item.data.sku, reason: 'database error while creating this row' });
      }
    }

    return NextResponse.json({
      totalRows: rows.length,
      created,
      rejected: rows.length - created,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
  }
}
