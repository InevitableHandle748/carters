export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/password-validation';

// POST: Verify emergency key and list admin users
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessKey, action, userId, newPassword } = body ?? {};

    // Verify emergency access key
    const envKey = process.env.EMERGENCY_ACCESS_KEY;
    if (!envKey || accessKey !== envKey) {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 });
    }

    // Action: list users (default)
    if (!action || action === 'list') {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
      });
      return NextResponse.json({
        authenticated: true,
        users: users.map((u: any) => ({
          ...u,
          createdAt: u?.createdAt?.toISOString?.() ?? null,
        })),
      });
    }

    // Action: reset password
    if (action === 'reset-password') {
      if (!userId || !newPassword) {
        return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });
      }

      const pwCheck = validatePassword(newPassword);
      if (!pwCheck.valid) {
        return NextResponse.json({ error: pwCheck.errors.join('. ') }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true, message: `Password reset for ${user.email}` });
    }

    // Action: promote user to admin
    if (action === 'promote-admin') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' },
      });

      return NextResponse.json({ success: true, message: `${user.email} promoted to ADMIN` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Emergency access error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
