'use client';
// Design Ref: §5.4 Page UI Checklist — 인프라요약/체크리스트/주변시세/지도/면책고지
import { useState } from 'react';
import type { ViewingGuide } from '@/types/viewing-guide';
import { KakaoMapEmbed } from '@/features/viewing-guide/components/KakaoMapEmbed';

const DISCLAIMER =
  '본 분석은 AI가 생성한 참고 자료이며, 법률적 판단은 전문가 상담을 받으시기 바랍니다.';

export function ViewingGuideContent({ guide }: { guide: ViewingGuide }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-base font-semibold">동네 인프라 요약</h2>
        <p className="text-sm leading-relaxed text-gray-700">{guide.infrastructureSummary}</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">임장 체크리스트</h2>
        <ul className="space-y-2" data-testid="viewing-checklist">
          {guide.checklist.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!checked[index]}
                onChange={() => setChecked((prev) => ({ ...prev, [index]: !prev[index] }))}
                className="mt-0.5"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">주변 실거래가</h2>
        {guide.nearbyPrices.length === 0 ? (
          <p className="text-sm text-gray-500">주변 실거래가 데이터가 없습니다.</p>
        ) : (
          <table className="w-full text-sm" data-testid="nearby-prices-table">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-1">단지명</th>
                <th className="py-1">거래일</th>
                <th className="py-1">가격</th>
                <th className="py-1">면적</th>
              </tr>
            </thead>
            <tbody>
              {guide.nearbyPrices.map((item, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1">{item.complexName}</td>
                  <td className="py-1">{item.dealDate}</td>
                  <td className="py-1">{item.price.toLocaleString('ko-KR')}원</td>
                  <td className="py-1">{item.area}㎡</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">지도</h2>
        {guide.coordinates ? (
          <KakaoMapEmbed lat={guide.coordinates.lat} lng={guide.coordinates.lng} />
        ) : (
          <p className="text-sm text-gray-500">좌표 정보가 없습니다.</p>
        )}
      </section>

      <p className="rounded bg-amber-50 p-3 text-xs text-amber-700">{DISCLAIMER}</p>
    </div>
  );
}
