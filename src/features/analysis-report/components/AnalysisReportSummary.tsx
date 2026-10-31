// Design Ref: §5.3/§5.4 — 말소기준권리/임차인 대항력/인수부담/예상낙찰가범위 표시
import type { AnalysisReport } from '@/types/analysis-report';
import { RIGHT_TYPE_LABELS } from '@/features/analysis-report/format';
import { formatWon } from '@/features/properties/format';

export function AnalysisReportSummary({ report }: { report: AnalysisReport }) {
  const baseRight = report.baseRightIndex != null ? report.rights[report.baseRightIndex] : null;
  const hasPriority =
    baseRight && report.tenantInfo?.moveInDate
      ? report.tenantInfo.moveInDate < baseRight.registeredAt
      : null;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-base font-semibold">말소기준권리</h2>
        {baseRight ? (
          <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">
            {RIGHT_TYPE_LABELS[baseRight.type]} ({baseRight.registeredAt} 설정)
          </p>
        ) : (
          <p className="text-sm text-gray-500">말소기준권리를 판단할 수 없습니다.</p>
        )}
      </section>

      {report.tenantInfo && (
        <section>
          <h2 className="mb-2 text-base font-semibold">임차인 대항력</h2>
          <p className="text-sm text-gray-700">
            전입일 {report.tenantInfo.moveInDate ?? '-'} / 확정일 {report.tenantInfo.confirmedDate ?? '-'} /
            보증금 {report.tenantInfo.deposit != null ? formatWon(report.tenantInfo.deposit) : '-'}
          </p>
          {hasPriority != null && (
            <p className={`mt-1 text-sm font-medium ${hasPriority ? 'text-green-700' : 'text-red-600'}`}>
              {hasPriority ? '대항력 있음(말소기준권리보다 전입이 빠름)' : '대항력 없음(말소기준권리 이후 전입)'}
            </p>
          )}
          {report.tenantInfo.confirmedDate && (
            <p className="mt-1 text-sm text-gray-600">
              우선변제권 기준일: {report.tenantInfo.confirmedDate}(확정일자 기준, 간이 분석)
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">인수부담 목록</h2>
        {report.assumedBurdens.length === 0 ? (
          <p className="text-sm text-gray-500">낙찰자가 인수하는 권리가 없습니다.</p>
        ) : (
          <table className="w-full text-sm" data-testid="assumed-burdens-table">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-1">종류</th>
                <th className="py-1">설정일</th>
                <th className="py-1">채권액</th>
              </tr>
            </thead>
            <tbody>
              {report.assumedBurdens.map((right, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1">{RIGHT_TYPE_LABELS[right.type]}</td>
                  <td className="py-1">{right.registeredAt}</td>
                  <td className="py-1">{formatWon(right.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">예상낙찰가 범위</h2>
        {report.expectedBidRange ? (
          <p className="text-sm text-gray-700">
            하 {formatWon(report.expectedBidRange.low)} / 중 {formatWon(report.expectedBidRange.mid)} / 상{' '}
            {formatWon(report.expectedBidRange.high)}
          </p>
        ) : (
          <p className="text-sm text-gray-500">예상낙찰가 범위를 추정할 수 없습니다.</p>
        )}
      </section>

      {report.explanationText && (
        <section>
          <h2 className="mb-2 text-base font-semibold">AI 설명</h2>
          <p className="text-sm leading-relaxed text-gray-700">{report.explanationText}</p>
        </section>
      )}
    </div>
  );
}
