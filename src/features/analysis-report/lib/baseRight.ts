// Design Ref: §9.4 Application — 말소기준권리 판단(순수함수). AI 비개입, 결정적 로직.
// 간이 분석 범위(Plan §2.2): 전세권의 말소기준권리 해당 여부(배당요구 등) 같은 특수 케이스는 제외.
import type { Right } from '@/types/analysis-report';

const BASE_RIGHT_ELIGIBLE_TYPES: Right['type'][] = [
  'mortgage',
  'seizure',
  'provisional_seizure',
  'auction_registration',
];

export function determineBaseRightIndex(rights: Right[]): number | null {
  let baseIndex: number | null = null;
  let basePriority = Infinity;

  rights.forEach((right, index) => {
    if (!BASE_RIGHT_ELIGIBLE_TYPES.includes(right.type)) return;
    if (right.priority < basePriority) {
      basePriority = right.priority;
      baseIndex = index;
    }
  });

  return baseIndex;
}

export function getAssumedBurdens(rights: Right[], baseRightIndex: number | null): Right[] {
  if (baseRightIndex == null) return [];
  const basePriority = rights[baseRightIndex].priority;
  return rights.filter((right) => right.priority < basePriority);
}
