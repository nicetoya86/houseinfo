// Design Ref: §5.1/§11.1 — 매물 상세 페이지 (ISR)
import { notFound } from 'next/navigation';
import { fetchPropertyById } from '@/features/properties/queries';
import { PropertyDetail } from '@/features/properties/components/PropertyDetail';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await fetchPropertyById(id);
  if (!property) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PropertyDetail property={property} />
    </main>
  );
}
