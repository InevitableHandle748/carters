export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any)?.role;
    const userId = (session.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams?.get?.('status') ?? '';
    const type = searchParams?.get?.('type') ?? '';
    const search = searchParams?.get?.('search') ?? '';

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { caseNumber: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        store: { select: { name: true, siteNumber: true } },
        dropShipStore: { select: { name: true, siteNumber: true } },
        items: { include: { product: { select: { name: true, sku: true, category: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests?.map?.((r: any) => ({
      ...r,
      createdAt: r?.createdAt?.toISOString?.() ?? null,
      updatedAt: r?.updatedAt?.toISOString?.() ?? null,
    })) ?? []);
  } catch (error: any) {
    console.error('Requests API error:', error);
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = (session.user as any)?.id;

    // Generate case number
    const count = await prisma.request.count();
    const caseNumber = `REQ-2026-${String(count + 1).padStart(4, '0')}`;

    const { items, ipAddress, dropShipStoreId, ...requestData } = body ?? {};

    const newRequest = await prisma.request.create({
      data: {
        ...requestData,
        caseNumber,
        userId,
        ...(ipAddress ? { ipAddress } : {}),
        ...(dropShipStoreId ? { dropShipStoreId } : {}),
      },
    });

    // Create request items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await prisma.requestItem.create({
          data: {
            requestId: newRequest.id,
            productId: item?.productId,
            quantity: item?.quantity ?? 1,
            installRequested: item?.installRequested ?? false,
          },
        });
      }
    }

    // Send notification
    try {
      const appUrl = process.env.NEXTAUTH_URL || '';
      const appName = appUrl ? new URL(appUrl).hostname?.split?.('.')?.[0] : 'Carters';
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_EQUIPMENT_REQUEST_SUBMITTED,
          subject: `New Equipment Request ${caseNumber} Submitted`,
          body: `<div style="font-family:Arial,sans-serif;"><h2>New Request: ${caseNumber}</h2><p>Type: ${requestData?.type}</p><p>Submitted by: ${session?.user?.name ?? session?.user?.email}</p><p>Priority: ${requestData?.priority ?? 'MEDIUM'}</p></div>`,
          is_html: true,
          recipient_email: 'wfz6rgd2f7@privaterelay.appleid.com',
          sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
          sender_alias: appName,
        }),
      });
    } catch (emailErr: any) {
      console.error('Email notification failed:', emailErr);
    }

    return NextResponse.json({
      ...newRequest,
      createdAt: newRequest?.createdAt?.toISOString?.(),
      updatedAt: newRequest?.updatedAt?.toISOString?.(),
    });
  } catch (error: any) {
    console.error('Create request error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
