export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Download an attachment (streams the binary content)
export async function GET(
  request: Request,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const att = await prisma.attachment.findFirst({
      where: { id: params?.attachmentId, requestId: params?.id },
    });
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = new Uint8Array(att.data as unknown as Buffer);
    const inline = att.mimeType?.startsWith('image/') || att.mimeType === 'application/pdf';
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': att.mimeType,
        'Content-Length': String(att.size),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(att.fileName)}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Attachment download error:', error);
    return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 });
  }
}

// Delete an attachment (admin, fulfiller, or the request owner)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    const att = await prisma.attachment.findFirst({
      where: { id: params?.attachmentId, requestId: params?.id },
      include: { request: { select: { userId: true } } },
    });
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = att.request?.userId === userId;
    if (role !== 'ADMIN' && role !== 'FULFILLER' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.attachment.delete({ where: { id: params?.attachmentId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Attachment delete error:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
