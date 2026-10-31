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

    const groupEntries = group.map((right) => ({
      right,
      claimedAmount: right.amount,
      paidAmount: totalClaim === 0 ? 0 : Math.floor((right.amount / totalClaim) * payable),
      shortfall: 0,
    }));
    const distributed = groupEntries.reduce((sum, e) => sum + e.paidAmount, 0);
    // D-03: floor 안분으로 생긴 잔여분은 뒤에서부터 각 항목의 채권액 한도 내에서 배정하고,
    // 한도를 넘는 초과분은 앞 항목으로 이월해 paidAmount가 claimedAmount를 넘지 않게 한다.
    let residue = payable - distributed;
    for (let i = groupEntries.length - 1; residue > 0 && i >= 0; i--) {
      const entry = groupEntries[i];
      const capacity = entry.claimedAmount - entry.paidAmount;
      const add = Math.min(capacity, residue);
      entry.paidAmount += add;
      residue -= add;
    }
    for (const entry of groupEntries) {
      entry.shortfall = entry.right.amount - entry.paidAmount;
      entries.push(entry);
    }

    remaining -= payable;
  }

  return entries;
}
