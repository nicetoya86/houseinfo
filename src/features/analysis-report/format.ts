// Design Ref: §5.4 — display formatting helpers for analysis-report UI
import type { RightType } from '@/types/analysis-report';

export const RIGHT_TYPE_LABELS: Record<RightType, string> = {
  mortgage: '(근)저당권',
  seizure: '압류',
  provisional_seizure: '가압류',
  lease_right: '전세권',
  auction_registration: '경매개시결정',
};
