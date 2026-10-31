// Design Ref: §2.1 — AnalysisReportSummary + DistributionSimulator 조립 + 면책고지
import type { AnalysisReport } from '@/types/analysis-report';
import { AnalysisReportSummary } from '@/features/analysis-report/components/AnalysisReportSummary';
import { DistributionSimulator } from '@/features/analysis-report/components/DistributionSimulator';

const DISCLAIMER =
  '본 분석은 AI가 생성한 참고 자료이며, 법률적 판단은 전문가 상담을 받으시기 바랍니다.';

export function AnalysisReportContent({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-6">
      <AnalysisReportSummary report={report} />
      <DistributionSimulator rights={report.rights} />
      <p className="rounded bg-amber-50 p-3 text-xs text-amber-700">{DISCLAIMER}</p>
    </div>
  );
}
