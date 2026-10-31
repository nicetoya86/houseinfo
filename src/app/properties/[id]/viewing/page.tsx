// Design Ref: §5.1/§11.1 — 임장정보 페이지, Server Component가 캐시만 읽음
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPropertyById } from '@/features/properties/queries';
import { fetchViewingGuideByPropertyId } from '@/features/viewing-guide/queries';
import { ViewingGuideContent } from '@/features/viewing-guide/components/ViewingGuideContent';
import { ViewingGuideEmptyState } from '@/features/viewing-guide/components/ViewingGuideEmptyState';

export default async function ViewingGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await fetchPropertyById(id);
  if (!property) notFound();

  const guide = await fetchViewingGuideByPropertyId(id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex gap-2 border-b border-gray-200" aria-label="상세 탭">
        <a href={`/properties/${id}`} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900">
          기본정보
        </a>
        <span className="border-b-2 border-blue-600 px-3 py-2 text-sm font-medium text-blue-600">
          임장정보
        </span>
        <Link
          href={`/properties/${id}/analysis`}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
        >
          권리분석
        </Link>
      </nav>

      {guide ? <ViewingGuideContent guide={guide} /> : <ViewingGuideEmptyState />}
    </main>
  );
}
