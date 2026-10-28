// Design Ref: §9.4 Application — filter query builder over Supabase
// Plan SC: 필터 응답 1초 이내 (idx_properties_filter / appraisal / min_bid / fail_count 인덱스 의존)
import { supabase } from '@/lib/supabase';
import type { Property, PropertyFilter, PropertyListResponse } from '@/types/property';

const DEFAULT_PAGE_SIZE = 20;

function rowToProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    caseNumber: row.case_number as string,
    type: row.type as Property['type'],
    category: row.category as Property['category'],
    sido: row.sido as string,
    sigungu: row.sigungu as string,
    eupmyeondong: (row.eupmyeondong as string) ?? null,
    address: row.address as string,
    appraisalValue: Number(row.appraisal_value),
    minBid: Number(row.min_bid),
    failCount: Number(row.fail_count),
    saleDate: row.sale_date as string,
    zoneType: (row.zone_type as string) ?? null,
    status: row.status as Property['status'],
    images: (row.images as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchProperties(filter: PropertyFilter): Promise<PropertyListResponse> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('sale_date', { ascending: true })
    .range(from, to);

  if (filter.sido?.length) query = query.in('sido', filter.sido);
  if (filter.sigungu?.length) query = query.in('sigungu', filter.sigungu);
  if (filter.category?.length) query = query.in('category', filter.category);
  if (filter.minAppraisal != null) query = query.gte('appraisal_value', filter.minAppraisal);
  if (filter.maxAppraisal != null) query = query.lte('appraisal_value', filter.maxAppraisal);
  if (filter.minBidFloor != null) query = query.gte('min_bid', filter.minBidFloor);
  if (filter.minBidCeil != null) query = query.lte('min_bid', filter.minBidCeil);
  if (filter.minFailCount != null) query = query.gte('fail_count', filter.minFailCount);
  if (filter.maxFailCount != null) query = query.lte('fail_count', filter.maxFailCount);
  if (filter.saleDateFrom) query = query.gte('sale_date', filter.saleDateFrom);
  if (filter.saleDateTo) query = query.lte('sale_date', filter.saleDateTo);
  if (filter.zoneType) query = query.eq('zone_type', filter.zoneType);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: (data ?? []).map(rowToProperty),
    pagination: { total: count ?? 0, page, pageSize },
  };
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToProperty(data) : null;
}
