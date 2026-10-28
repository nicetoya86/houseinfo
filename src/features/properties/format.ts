// Design Ref: §5.4 — display formatting helpers for property cards/detail
import type { PropertyCategory } from '@/types/property';

export const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  apartment: '아파트',
  villa: '다세대',
  officetel: '오피스텔',
  commercial: '상가',
  land: '토지',
  factory: '공장',
  etc: '기타',
};

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatFailCount(count: number): string {
  return count === 0 ? '신건' : `${count}회 유찰`;
}
