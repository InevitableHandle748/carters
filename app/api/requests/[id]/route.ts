export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const req = await prisma.request.findUnique({
      where: { id: params?.id },
      include: {
        user: { select: { name: true, email: true } },
        store: true,
        dropShipStore: true,
        items: { include: { product: true, shipmentItems: true } },
        shipments: {
          include: {
            items: {
              include: {
                requestItem: { include: { product: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' as const },
        },
        addendums: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' as const },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' as const },
        },
      },
    });
    if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...req,
      createdAt: req?.createdAt?.toISOString?.() ?? null,
      updatedAt: req?.updatedAt?.toISOString?.() ?? null,
      store: req?.store ? { ...req.store, createdAt: req.store?.createdAt?.toISOString?.(), updatedAt: req.store?.updatedAt?.toISOString?.() } : null,
      dropShipStore: (req as any)?.dropShipStore ? { ...(req as any).dropShipStore, createdAt: (req as any).dropShipStore?.createdAt?.toISOString?.(), updatedAt: (req as any).dropShipStore?.updatedAt?.toISOString?.() } : null,
      items: req?.items?.map?.((i: any) => ({
        ...i,
        product: { ...i?.product, createdAt: i?.product?.createdAt?.toISOString?.(), updatedAt: i?.product?.updatedAt?.toISOString?.() },
      })) ?? [],
      shipments: (req as any)?.shipments?.map?.((s: any) => ({
        ...s,
        shippedAt: s?.shippedAt?.toISOString?.() ?? null,
        deliveredAt: s?.deliveredAt?.toISOString?.() ?? null,
        createdAt: s?.createdAt?.toISOString?.() ?? null,
        updatedAt: s?.updatedAt?.toISOString?.() ?? null,
      })) ?? [],
      addendums: (req as any)?.addendums?.map?.((a: any) => ({
        ...a,
        createdAt: a?.createdAt?.toISOString?.() ?? null,
      })) ?? [],
      attachments: (req as any)?.attachments?.map?.((a: any) => ({
        ...a,
        createdAt: a?.createdAt?.toISOString?.() ?? null,
      })) ?? [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const body = await request.json();

    // Requesters can only add notes to their open requests
    if (role === 'REQUESTER') {
      if (body.notes === undefined || Object.keys(body).some(k => k !== 'notes')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (role !== 'FULFILLER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.request.update({ where: { id: params?.id }, data: body });

    // Send status update notification
    if (body?.status) {
      try {
        const req = await prisma.request.findUnique({ where: { id: params?.id }, include: { user: true } });
        const appUrl = process.env.NEXTAUTH_URL || '';
        const appName = appUrl ? new URL(appUrl).hostname?.split?.('.')?.[0] : 'Carters';
        await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deployment_token: process.env.ABACUSAI_API_KEY,
            app_id: process.env.WEB_APP_ID,
            notification_id: process.env.NOTIF_ID_REQUEST_STATUS_UPDATE,
            subject: `Request ${updated?.caseNumber} Status Updated to ${body.status}`,
            body: `<div style="font-family:Arial,sans-serif;"><h2>Request Status Update</h2><p>Case: ${updated?.caseNumber}</p><p>New Status: <strong>${body.status}</strong></p></div>`,
            is_html: true,
            recipient_email: req?.user?.email ?? 'wfz6rgd2f7@privaterelay.appleid.com',
            sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
            sender_alias: appName,
          }),
        });
      } catch (emailErr: any) {
        console.error('Status notification failed:', emailErr);
      }
    }

    return NextResponse.json({
      ...updated,
      createdAt: updated?.createdAt?.toISOString?.(),
      updatedAt: updated?.updatedAt?.toISOString?.(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// Delete a request and all associated records (RequestItems, Shipments, ShipmentItems, Addendums cascade automatically)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can delete requests' }, { status: 403 });
    }

    const req = await prisma.request.findUnique({ 
      where: { id: params?.id },
      select: { caseNumber: true }
    });
    
    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Delete the request - all related records cascade automatically via schema
    await prisma.request.delete({ where: { id: params?.id } });

    return NextResponse.json({ 
      success: true,
      message: `Request ${req.caseNumber} and all associated records deleted successfully`
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
