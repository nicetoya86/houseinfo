// Design Ref: §5.1/§5.2 — 권리분석 페이지, 캐시 없으면 업로드 폼, 있으면 분석결과+배당시뮬레이터
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPropertyById } from '@/features/properties/queries';
import { fetchAnalysisReportByPropertyId } from '@/features/analysis-report/queries';
import { RightsUploadForm } from '@/features/analysis-report/components/RightsUploadForm';
import { AnalysisReportContent } from '@/features/analysis-report/components/AnalysisReportContent';

export default async function AnalysisReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reupload?: string }>;
}) {
  const { id } = await params;
  const { reupload } = await searchParams;
  const property = await fetchPropertyById(id);
  if (!property) notFound();

  const report = await fetchAnalysisReportByPropertyId(id);
  const hasReport = !!report && report.rights.length > 0;
  const showUploadForm = !hasReport || reupload === '1';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex gap-2 border-b border-gray-200" aria-label="상세 탭">
        <Link href={`/properties/${id}`} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900">
          기본정보
        </Link>
        <Link
          href={`/properties/${id}/viewing`}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
        >
          임장정보
        </Link>
        <span className="border-b-2 border-blue-600 px-3 py-2 text-sm font-medium text-blue-600">
          권리분석
        </span>
      </nav>

      {!showUploadForm && report ? (
        <>
          <div className="mb-4 text-right">
            <Link
              href={`/properties/${id}/analysis?reupload=1`}
              className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
            >
              다시 업로드
            </Link>
          </div>
          <AnalysisReportContent report={report} />
        </>
      ) : (
        <>
          {report?.qualityFlag === 'needs_review' && (
            <p className="mb-4 text-sm text-amber-700">
              이전 업로드에서 권리 정보를 추출하지 못했습니다. 등기부등본을 다시 업로드해 주세요.
            </p>
          )}
          {hasReport && (
            <div className="mb-4">
              <Link href={`/properties/${id}/analysis`} className="text-sm text-gray-500 hover:underline">
                ← 기존 분석결과로 돌아가기
              </Link>
            </div>
          )}
          <RightsUploadForm propertyId={id} />
        </>
      )}
    </main>
  );
}
