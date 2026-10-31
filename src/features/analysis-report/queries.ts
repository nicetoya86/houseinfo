// Design Ref: §3.3, §7 — analysis_reports는 service role 전용 접근(개인정보 포함 가능)
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { AnalysisReport, Right, TenantInfo } from '@/types/analysis-report';

function rowToAnalysisReport(row: Record<string, unknown>): AnalysisReport {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    sourceFilePath: row.source_file_path as string,
    rights: (row.rights as Right[]) ?? [],
    baseRightIndex: (row.base_right_index as number | null) ?? null,
    tenantInfo: (row.tenant_info as TenantInfo | null) ?? null,
    assumedBurdens: (row.assumed_burdens as Right[]) ?? [],
    expectedBidRange: (row.expected_bid_range as AnalysisReport['expectedBidRange']) ?? null,
    explanationText: (row.explanation_text as string) ?? '',
    qualityFlag: row.quality_flag as AnalysisReport['qualityFlag'],
    createdAt: row.created_at as string,
  };
}

export async function fetchAnalysisReportByPropertyId(
  propertyId: string,
): Promise<AnalysisReport | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAnalysisReport(data) : null;
}

export interface UpsertAnalysisReportInput {
  propertyId: string;
  sourceFilePath: string;
  rights: Right[];
  baseRightIndex: number | null;
  tenantInfo: TenantInfo | null;
  assumedBurdens: Right[];
  expectedBidRange: AnalysisReport['expectedBidRange'];
  explanationText: string;
  qualityFlag: AnalysisReport['qualityFlag'];
}

export async function upsertAnalysisReport(
  input: UpsertAnalysisReportInput,
): Promise<AnalysisReport> {
  const { data, error } = await supabaseAdmin
    .from('analysis_reports')
    .upsert(
      {
        property_id: input.propertyId,
        source_file_path: input.sourceFilePath,
        rights: input.rights,
        base_right_index: input.baseRightIndex,
        tenant_info: input.tenantInfo,
        assumed_burdens: input.assumedBurdens,
        expected_bid_range: input.expectedBidRange,
        explanation_text: input.explanationText,
        quality_flag: input.qualityFlag,
      },
      { onConflict: 'property_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return rowToAnalysisReport(data);
}
