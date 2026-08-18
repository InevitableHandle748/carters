export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams?.get?.('search') ?? '';

    const where: any = { published: true };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(articles?.map?.((a: any) => ({
      ...a,
      createdAt: a?.createdAt?.toISOString?.() ?? null,
      updatedAt: a?.updatedAt?.toISOString?.() ?? null,
    })) ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const article = await prisma.knowledgeArticle.create({ data: body });
    return NextResponse.json({ ...article, createdAt: article?.createdAt?.toISOString?.(), updatedAt: article?.updatedAt?.toISOString?.() });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
