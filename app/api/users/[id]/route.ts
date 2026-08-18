export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/password-validation';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const data: any = { name: body?.name, email: body?.email, role: body?.role };
    if (body?.password) {
      const pwCheck = validatePassword(body.password);
      if (!pwCheck.valid) {
        return NextResponse.json({ error: pwCheck.errors.join('. ') }, { status: 400 });
      }
      data.password = await bcrypt.hash(body.password, 10);
    }
    const user = await prisma.user.update({ where: { id: params?.id }, data });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await prisma.user.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
