import { ArticleDetailClient } from './_components/article-detail-client';

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  return <ArticleDetailClient id={params?.id ?? ''} />;
}
