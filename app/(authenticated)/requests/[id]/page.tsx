import { RequestDetailClient } from './_components/request-detail-client';

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  return <RequestDetailClient id={params?.id ?? ''} />;
}
