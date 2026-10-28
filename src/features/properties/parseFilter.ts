// Design Ref: §4.2 — parse /api/properties query string into PropertyFilter
import type { PropertyCategory, PropertyFilter } from '@/types/property';

function toNumber(value: string | null): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const list = value.split(',').map((v) => v.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

export function parsePropertyFilter(searchParams: URLSearchParams): PropertyFilter {
  return {
    sido: toList(searchParams.get('sido')),
    sigungu: toList(searchParams.get('sigungu')),
    category: toList(searchParams.get('category')) as PropertyCategory[] | undefined,
    minAppraisal: toNumber(searchParams.get('minAppraisal')),
    maxAppraisal: toNumber(searchParams.get('maxAppraisal')),
    minBidFloor: toNumber(searchParams.get('minBidFloor')),
    minBidCeil: toNumber(searchParams.get('minBidCeil')),
    minFailCount: toNumber(searchParams.get('minFailCount')),
    maxFailCount: toNumber(searchParams.get('maxFailCount')),
    saleDateFrom: searchParams.get('saleDateFrom') ?? undefined,
    saleDateTo: searchParams.get('saleDateTo') ?? undefined,
    zoneType: searchParams.get('zoneType') ?? undefined,
    page: toNumber(searchParams.get('page')),
    pageSize: toNumber(searchParams.get('pageSize')),
  };
}
