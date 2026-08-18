export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET all shipments for a request
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const shipments = await prisma.shipment.findMany({
      where: { requestId: params.id },
      include: {
        items: {
          include: {
            requestItem: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      shipments.map((s: any) => ({
        ...s,
        shippedAt: s.shippedAt?.toISOString() ?? null,
        deliveredAt: s.deliveredAt?.toISOString() ?? null,
        createdAt: s.createdAt?.toISOString() ?? null,
        updatedAt: s.updatedAt?.toISOString() ?? null,
      }))
    );
  } catch (error: any) {
    console.error('Fetch shipments error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

// POST create a new shipment for a request
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'FULFILLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { carrier, trackingNumber, trackingUrl, notes, items } = body ?? {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Validate the request exists
    const req = await prisma.request.findUnique({
      where: { id: params.id },
      include: { items: { include: { shipmentItems: true } } },
    });
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // Validate quantities don't exceed remaining
    for (const shipItem of items) {
      const reqItem = req.items.find((ri: any) => ri.id === shipItem.requestItemId);
      if (!reqItem) {
        return NextResponse.json({ error: `Request item ${shipItem.requestItemId} not found` }, { status: 400 });
      }
      const alreadyShipped = reqItem.shipmentItems.reduce((sum: number, si: any) => sum + si.quantity, 0);
      const remaining = reqItem.quantity - alreadyShipped;
      if (shipItem.quantity > remaining) {
        return NextResponse.json(
          { error: `Cannot ship ${shipItem.quantity} of ${reqItem.id} — only ${remaining} remaining` },
          { status: 400 }
        );
      }
    }

    // Generate shipment number
    const count = await prisma.shipment.count({ where: { requestId: params.id } });
    const shipmentNumber = `${req.caseNumber}-S${String(count + 1).padStart(2, '0')}`;

    const shipment = await prisma.shipment.create({
      data: {
        requestId: params.id,
        shipmentNumber,
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        notes: notes || null,
        items: {
          create: items.map((i: any) => ({
            requestItemId: i.requestItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            requestItem: { include: { product: true } },
          },
        },
      },
    });

    // Auto-update request status to SHIPPED if it was APPROVED
    if (req.status === 'APPROVED' || req.status === 'PENDING') {
      await prisma.request.update({
        where: { id: params.id },
        data: { status: 'SHIPPED' },
      });
    }

    // Check if all items are fully shipped -> auto-complete
    const updatedReq = await prisma.request.findUnique({
      where: { id: params.id },
      include: { items: { include: { shipmentItems: true } } },
    });
    if (updatedReq) {
      const allFullyShipped = updatedReq.items.every((ri: any) => {
        const shipped = ri.shipmentItems.reduce((sum: number, si: any) => sum + si.quantity, 0);
        return shipped >= ri.quantity;
      });
      // Don't auto-complete, just ensure SHIPPED status
    }

    return NextResponse.json({
      ...shipment,
      shippedAt: shipment.shippedAt?.toISOString() ?? null,
      deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
      createdAt: shipment.createdAt?.toISOString() ?? null,
      updatedAt: shipment.updatedAt?.toISOString() ?? null,
    });
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
