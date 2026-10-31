// Design Ref: §5.4 — 상세 기본정보 탭 전체 필드. 임장정보는 viewing-guide feature로 활성화됨(F3 지도/권리분석은 비활성)
import Link from 'next/link';
import type { Property } from '@/types/property';
import { CATEGORY_LABELS, formatFailCount, formatWon } from '@/features/properties/format';

export function PropertyDetail({ property }: { property: Property }) {
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-gray-200" aria-label="상세 탭">
        <span className="border-b-2 border-blue-600 px-3 py-2 text-sm font-medium text-blue-600">
          기본정보
        </span>
        <Link
          href={`/properties/${property.id}/viewing`}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
        >
          임장정보
        </Link>
        <Link
          href={`/properties/${property.id}/analysis`}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
        >
          권리분석
        </Link>
      </nav>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2" data-testid="property-basic-info">
        <Field label="사건번호" value={property.caseNumber} />
        <Field label="소재지" value={property.address} />
        <Field label="물건종류" value={CATEGORY_LABELS[property.category]} />
        <Field label="감정가" value={formatWon(property.appraisalValue)} />
        <Field label="최저가" value={formatWon(property.minBid)} />
        <Field label="유찰횟수" value={formatFailCount(property.failCount)} />
        <Field label="매각기일" value={property.saleDate} />
        <Field label="용도지역" value={property.zoneType ?? '-'} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
