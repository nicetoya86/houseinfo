'use client';
// Design Ref: §5.4 Page UI Checklist — 소재지/물건종류/감정가/최저가/유찰횟수/매각기일/용도지역 필터
import { usePropertyFilterStore } from '@/features/properties/store';
import { CATEGORY_LABELS } from '@/features/properties/format';
import type { PropertyCategory } from '@/types/property';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [PropertyCategory, string][];
const ZONE_OPTIONS = ['주거', '상업', '공업', '녹지'];
const FAIL_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5];

// Analysis Gap §2.5 — 쉼표로 여러 값 입력 시 다중선택으로 처리 (지역 데이터셋 없어 자유입력 방식 채택)
function parseMultiValue(raw: string): string[] | undefined {
  const list = raw.split(',').map((v) => v.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

export function PropertyFilterPanel() {
  const { filter, setFilter, resetFilter } = usePropertyFilterStore();

  return (
    <form
      aria-label="매물 필터"
      className="space-y-4 rounded-lg border border-gray-200 p-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <div>
        <label htmlFor="sido" className="mb-1 block text-sm font-medium">
          소재지(시/도, 쉼표로 다중선택)
        </label>
        <input
          id="sido"
          type="text"
          placeholder="예: 서울, 경기"
          defaultValue={filter.sido?.join(', ') ?? ''}
          onBlur={(e) => setFilter({ sido: parseMultiValue(e.target.value) })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label htmlFor="sigungu" className="mb-1 block text-sm font-medium">
          시/군/구(쉼표로 다중선택)
        </label>
        <input
          id="sigungu"
          type="text"
          placeholder="예: 강남구, 서초구"
          defaultValue={filter.sigungu?.join(', ') ?? ''}
          onBlur={(e) => setFilter({ sigungu: parseMultiValue(e.target.value) })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          물건종류
        </label>
        <select
          id="category"
          value={filter.category?.[0] ?? ''}
          onChange={(e) =>
            setFilter({ category: e.target.value ? [e.target.value as PropertyCategory] : undefined })
          }
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">전체</option>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">감정가 범위(원)</span>
        <div className="flex gap-2">
          <input
            type="number"
            aria-label="감정가 최소"
            placeholder="최소"
            value={filter.minAppraisal ?? ''}
            onChange={(e) => setFilter({ minAppraisal: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            aria-label="감정가 최대"
            placeholder="최대"
            value={filter.maxAppraisal ?? ''}
            onChange={(e) => setFilter({ maxAppraisal: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">최저가 범위(원)</span>
        <div className="flex gap-2">
          <input
            type="number"
            aria-label="최저가 최소"
            placeholder="최소"
            value={filter.minBidFloor ?? ''}
            onChange={(e) => setFilter({ minBidFloor: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            aria-label="최저가 최대"
            placeholder="최대"
            value={filter.minBidCeil ?? ''}
            onChange={(e) => setFilter({ minBidCeil: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="minFailCount" className="mb-1 block text-sm font-medium">
          유찰횟수(이상)
        </label>
        <select
          id="minFailCount"
          value={filter.minFailCount ?? ''}
          onChange={(e) => setFilter({ minFailCount: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">전체</option>
          {FAIL_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}회 이상
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">매각기일</span>
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="매각기일 시작"
            value={filter.saleDateFrom ?? ''}
            onChange={(e) => setFilter({ saleDateFrom: e.target.value || undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="date"
            aria-label="매각기일 종료"
            value={filter.saleDateTo ?? ''}
            onChange={(e) => setFilter({ saleDateTo: e.target.value || undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="zoneType" className="mb-1 block text-sm font-medium">
          용도지역
        </label>
        <select
          id="zoneType"
          value={filter.zoneType ?? ''}
          onChange={(e) => setFilter({ zoneType: e.target.value || undefined })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">전체</option>
          {ZONE_OPTIONS.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={resetFilter}
        className="w-full rounded border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        필터 초기화
      </button>
    </form>
  );
}
