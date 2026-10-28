// Design Ref: §5.4 Page UI Checklist — 사건번호/소재지/감정가/최저가/유찰횟수/매각기일/사진
import Link from 'next/link';
import type { Property } from '@/types/property';
import { CATEGORY_LABELS, formatFailCount, formatWon } from '@/features/properties/format';

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      data-testid="property-card"
      className="block rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 hover:shadow-sm"
    >
      <div className="mb-2 flex aspect-video items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
        {property.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.images[0]} alt={property.address} className="h-full w-full rounded object-cover" />
        ) : (
          '사진 없음'
        )}
      </div>
      <p className="text-xs text-gray-500">
        {property.caseNumber} · {CATEGORY_LABELS[property.category]}
      </p>
      <p className="truncate text-sm font-medium">{property.address}</p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span>감정가 {formatWon(property.appraisalValue)}</span>
        <span className="font-semibold text-blue-600">최저가 {formatWon(property.minBid)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>{formatFailCount(property.failCount)}</span>
        <span>매각기일 {property.saleDate}</span>
      </div>
    </Link>
  );
}
