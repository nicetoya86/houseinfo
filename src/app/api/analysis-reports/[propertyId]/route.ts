// Design Ref: §4.2 — GET /api/analysis-reports/:propertyId
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/requireUser';
import { fetchAnalysisReportByPropertyId } from '@/features/analysis-report/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const denied = await requireUser(request);
  if (denied) return denied;
  const { propertyId } = await params;
  try {
    const report = await fetchAnalysisReportByPropertyId(propertyId);
    return NextResponse.json({ data: report });
  } catch (error) {
    console.error('[analysis-reports/:propertyId] failed:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analysis report' } },
      { status: 500 },
    );
  }
}
