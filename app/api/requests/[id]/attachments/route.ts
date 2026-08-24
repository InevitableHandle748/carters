export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const MAX_FILES = 3;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'csv', 'xls', 'xlsx'];
const getFileExtension = (name: string) => (name.split('.').pop() ?? '').toLowerCase();

// List attachments (metadata only, no binary data)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const attachments = await prisma.attachment.findMany({
      where: { requestId: params?.id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        uploadedBy: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments?.map?.((a: any) => ({
      ...a,
      createdAt: a?.createdAt?.toISOString?.() ?? null,
    })) ?? []);
  } catch (error: any) {
    console.error('Attachments GET error:', error);
    return NextResponse.json({ error: 'Failed to load attachments' }, { status: 500 });
  }
}

// Upload one or more attachments (multipart/form-data, field name "files")
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;

    // Ensure request exists
    const req = await prisma.request.findUnique({ where: { id: params?.id }, select: { id: true } });
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const formData = await request.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Enforce max total attachments per request
    const existingCount = await prisma.attachment.count({ where: { requestId: params?.id } });
    if (existingCount + files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} attachments per request. This request already has ${existingCount}.` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_EXTENSIONS.includes(getFileExtension(file.name))) {
        return NextResponse.json(
          { error: `"${file.name}" is not an allowed type. Only PDF, JPG, PNG, Excel, and CSV are accepted.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `"${file.name}" exceeds the 5MB size limit.` },
          { status: 400 }
        );
      }
    }

    // Persist files
    const created: any[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const att = await prisma.attachment.create({
        data: {
          requestId: params?.id,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          data: buffer,
          uploadedBy: userId,
        },
        select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
      });
      created.push({ ...att, createdAt: att.createdAt?.toISOString?.() ?? null });
    }

    return NextResponse.json({ success: true, attachments: created });
  } catch (error: any) {
    console.error('Attachment upload error:', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}
