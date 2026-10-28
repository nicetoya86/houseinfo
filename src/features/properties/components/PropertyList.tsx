'use client';
// Design Ref: §5.4 — 카드 리스트 + 5번째 카드마다 인피드 광고 + 무한스크롤
// Plan SC: 필터 응답 1초 이내 (API가 인덱스 활용 쿼리를 수행)
import { startTransition, useEffect, useRef, useState } from 'react';
import { usePropertyFilterStore } from '@/features/properties/store';
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { InFeedAdSlot } from '@/components/ads/InFeedAdSlot';
import type { Property, PropertyFilter } from '@/types/property';

const IN_FEED_INTERVAL = 5;

function buildQueryString(filter: PropertyFilter): string {
  const params = new URLSearchParams();
  if (filter.sido?.length) params.set('sido', filter.sido.join(','));
  if (filter.sigungu?.length) params.set('sigungu', filter.sigungu.join(','));
  if (filter.category?.length) params.set('category', filter.category.join(','));
  if (filter.minAppraisal != null) params.set('minAppraisal', String(filter.minAppraisal));
  if (filter.maxAppraisal != null) params.set('maxAppraisal', String(filter.maxAppraisal));
  if (filter.minBidFloor != null) params.set('minBidFloor', String(filter.minBidFloor));
  if (filter.minBidCeil != null) params.set('minBidCeil', String(filter.minBidCeil));
  if (filter.minFailCount != null) params.set('minFailCount', String(filter.minFailCount));
  if (filter.maxFailCount != null) params.set('maxFailCount', String(filter.maxFailCount));
  if (filter.saleDateFrom) params.set('saleDateFrom', filter.saleDateFrom);
  if (filter.saleDateTo) params.set('saleDateTo', filter.saleDateTo);
  if (filter.zoneType) params.set('zoneType', filter.zoneType);
  params.set('page', String(filter.page ?? 1));
  params.set('pageSize', String(filter.pageSize ?? 20));
  return params.toString();
}

export function PropertyList() {
  const { filter, setFilter } = usePropertyFilterStore();
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 필터(페이지 제외)가 바뀌면 1페이지부터 다시 로드
  const filterKey = JSON.stringify({ ...filter, page: undefined });

  useEffect(() => {
    let cancelled = false;
    startTransition(() => setLoading(true));
    fetch(`/api/properties?${buildQueryString({ ...filter, page: 1 })}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setItems(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    const page = filter.page ?? 1;
    if (page === 1) return;
    let cancelled = false;
    startTransition(() => setLoading(true));
    fetch(`/api/properties?${buildQueryString(filter)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setItems((prev) => [...prev, ...(json.data ?? [])]);
        setTotal(json.pagination?.total ?? 0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && items.length < total) {
        setFilter({ page: (filter.page ?? 1) + 1 });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, items.length, total, filter.page, setFilter]);

  const rows: React.ReactNode[] = [];
  items.forEach((property, index) => {
    rows.push(<PropertyCard key={property.id} property={property} />);
    if ((index + 1) % IN_FEED_INTERVAL === 0) {
      rows.push(<InFeedAdSlot key={`ad-${property.id}`} />);
    }
  });

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows}</div>
      {!loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">조건에 맞는 매물이 없습니다.</p>
      )}
      <div ref={sentinelRef} className="h-4" />
      {loading && <p className="py-4 text-center text-sm text-gray-400">불러오는 중...</p>}
    </div>
  );
}
