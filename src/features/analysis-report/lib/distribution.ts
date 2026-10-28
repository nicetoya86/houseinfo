// Design Ref: §8.2 — 배당 시뮬레이션(순수함수). 선순위 전액배당, 동순위 안분비례. AI 비개입.
// Plan SC: 배당액 합계는 입력된 예상낙찰가를 초과하지 않음.
import type { DistributionEntry, Right } from '@/types/analysis-report';

export function calculateDistribution(rights: Right[], bidAmount: number): DistributionEntry[] {
  const sorted = [...rights].sort((a, b) => a.priority - b.priority);
  const groups = new Map<number, Right[]>();
  for (const right of sorted) {
    const group = groups.get(right.priority) ?? [];
    group.push(right);
    groups.set(right.priority, group);
  }

  let remaining = bidAmount;
  const entries: DistributionEntry[] = [];

  for (const group of groups.values()) {
    const totalClaim = group.reduce((sum, r) => sum + r.amount, 0);
    const payable = Math.min(remaining, totalClaim);

    for (const right of group) {
      const paidAmount =
        totalClaim === 0 ? 0 : Math.floor((right.amount / totalClaim) * payable);
      entries.push({
        right,
        claimedAmount: right.amount,
        paidAmount,
        shortfall: right.amount - paidAmount,
      });
    }

    remaining -= payable;
  }

  return entries;
}
