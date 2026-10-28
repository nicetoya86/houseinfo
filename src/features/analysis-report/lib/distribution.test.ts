// Design Ref: §8.2 L1 Unit Test Scenarios
import { describe, expect, it } from 'vitest';
import { calculateDistribution } from './distribution';
import type { Right } from '@/types/analysis-report';

function right(overrides: Partial<Right>): Right {
  return {
    type: 'mortgage',
    label: '근저당권설정',
    registeredAt: '2023-01-01',
    amount: 0,
    priority: 1,
    ...overrides,
  };
}

describe('calculateDistribution', () => {
  it('선순위 전액배당: 1순위 3억, 낙찰가 5억 → 1순위 전액, 잔여 2억은 2순위로', () => {
    const rights = [
      right({ priority: 1, amount: 300_000_000 }),
      right({ priority: 2, amount: 200_000_000 }),
    ];
    const result = calculateDistribution(rights, 500_000_000);
    expect(result.find((e) => e.right.priority === 1)?.paidAmount).toBe(300_000_000);
    expect(result.find((e) => e.right.priority === 2)?.paidAmount).toBe(200_000_000);
  });

  it('안분배당: 동순위 2건 각 2억, 낙찰가 2억 → 각 1억씩(50%)', () => {
    const rights = [
      right({ priority: 1, amount: 200_000_000 }),
      right({ priority: 1, amount: 200_000_000 }),
    ];
    const result = calculateDistribution(rights, 200_000_000);
    expect(result).toHaveLength(2);
    for (const entry of result) {
      expect(entry.paidAmount).toBe(100_000_000);
    }
  });

  it('배당 부족: 1순위 5억, 낙찰가 3억 → 3억만 배당, shortfall 2억', () => {
    const rights = [right({ priority: 1, amount: 500_000_000 })];
    const result = calculateDistribution(rights, 300_000_000);
    expect(result[0].paidAmount).toBe(300_000_000);
    expect(result[0].shortfall).toBe(200_000_000);
  });
});
