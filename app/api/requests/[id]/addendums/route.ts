export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const addendums = await prisma.addendum.findMany({
      where: { requestId: params.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(addendums.map((a: any) => ({
      ...a,
      createdAt: a.createdAt?.toISOString?.() ?? null,
    })));
  } catch (error: any) {
    console.error('Addendums GET error:', error);
    return NextResponse.json({ error: 'Failed to load addendums' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any)?.id;
    const body = await request.json();
    const { type, description, oldValue, newValue, applyChanges } = body;

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required' }, { status: 400 });
    }

    // Apply side effects based on addendum type
    if (applyChanges) {
      if (type === 'STORE_CHANGE' && body.newStoreId) {
        await prisma.request.update({
          where: { id: params.id },
          data: { storeId: body.newStoreId },
        });
      }
      if (type === 'IP_CHANGE' && body.newIpAddress !== undefined) {
        await prisma.request.update({
          where: { id: params.id },
          data: { ipAddress: body.newIpAddress },
        });
      }
      if (type === 'DROP_SHIP_CHANGE' && body.newDropShipStoreId !== undefined) {
        await prisma.request.update({
          where: { id: params.id },
          data: { dropShipStoreId: body.newDropShipStoreId || null },
        });
      }
    }

    const addendum = await prisma.addendum.create({
      data: {
        requestId: params.id,
        type,
        description,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        createdBy: userId,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
      ...addendum,
      createdAt: addendum.createdAt?.toISOString?.() ?? null,
    });
  } catch (error: any) {
    console.error('Addendum create error:', error);
    return NextResponse.json({ error: 'Failed to create addendum' }, { status: 500 });
  }
}
