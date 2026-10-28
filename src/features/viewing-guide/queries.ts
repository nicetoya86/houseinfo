// Design Ref: §4.2 — 캐시 읽기 전용 쿼리. 생성은 n8n 파이프라인 B 책임.
import { supabase } from '@/lib/supabase';
import type { ViewingGuide } from '@/types/viewing-guide';

function rowToViewingGuide(row: Record<string, unknown>): ViewingGuide {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    infrastructureSummary: row.infrastructure_summary as string,
    checklist: (row.checklist as string[]) ?? [],
    nearbyPrices: (row.nearby_prices as ViewingGuide['nearbyPrices']) ?? [],
    nearbyFacilities: (row.nearby_facilities as ViewingGuide['nearbyFacilities']) ?? [],
    coordinates: (row.coordinates as ViewingGuide['coordinates']) ?? null,
    generatedBy: row.generated_by as string,
    qualityFlag: row.quality_flag as ViewingGuide['qualityFlag'],
    createdAt: row.created_at as string,
  };
}

export async function fetchViewingGuideByPropertyId(propertyId: string): Promise<ViewingGuide | null> {
  const { data, error } = await supabase
    .from('viewing_guides')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToViewingGuide(data) : null;
}
