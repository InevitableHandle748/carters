export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT update a shipment (tracking info, mark delivered)
export async function PUT(
  request: Request,
  { params }: { params: { id: string; shipmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'FULFILLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data: any = {};
    if (body.carrier !== undefined) data.carrier = body.carrier;
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber;
    if (body.trackingUrl !== undefined) data.trackingUrl = body.trackingUrl;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.deliveredAt !== undefined) data.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;
    if (body.markDelivered) data.deliveredAt = new Date();

    const shipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data,
      include: {
        items: {
          include: {
            requestItem: { include: { product: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...shipment,
      shippedAt: shipment.shippedAt?.toISOString() ?? null,
      deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
      createdAt: shipment.createdAt?.toISOString() ?? null,
      updatedAt: shipment.updatedAt?.toISOString() ?? null,
    });
  } catch (error: any) {
    console.error('Update shipment error:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

// DELETE a shipment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; shipmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.shipment.delete({ where: { id: params.shipmentId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete shipment error:', error);
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}
