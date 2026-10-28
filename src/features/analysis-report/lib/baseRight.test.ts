import { describe, expect, it } from 'vitest';
import { determineBaseRightIndex, getAssumedBurdens } from './baseRight';
import type { Right } from '@/types/analysis-report';

function right(overrides: Partial<Right>): Right {
  return {
    type: 'mortgage',
    label: '근저당권설정',
    registeredAt: '2023-01-01',
    amount: 100_000_000,
    priority: 1,
    ...overrides,
  };
}

describe('determineBaseRightIndex', () => {
  it('최선순위 저당권을 말소기준권리로 판단', () => {
    const rights = [
      right({ priority: 2, type: 'mortgage' }),
      right({ priority: 1, type: 'seizure' }),
    ];
    expect(determineBaseRightIndex(rights)).toBe(1);
  });

  it('권리가 없으면 null 반환', () => {
    expect(determineBaseRightIndex([])).toBeNull();
  });
});

describe('getAssumedBurdens', () => {
  it('말소기준권리보다 선순위인 권리만 인수부담으로 분류', () => {
    const rights = [
      right({ priority: 1, type: 'lease_right' }),
      right({ priority: 2, type: 'mortgage' }),
      right({ priority: 3, type: 'seizure' }),
    ];
    const baseIndex = determineBaseRightIndex(rights);
    const burdens = getAssumedBurdens(rights, baseIndex);
    expect(burdens).toHaveLength(1);
    expect(burdens[0].type).toBe('lease_right');
  });
});
