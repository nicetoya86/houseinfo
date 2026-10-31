'use client';
// Design Ref: §5.3/§5.4 — 낙찰가 입력 폼 + 배당표(클라이언트에서 즉시 재계산, AI 비개입)
import { useState } from 'react';
import type { Right } from '@/types/analysis-report';
import { calculateDistribution } from '@/features/analysis-report/lib/distribution';
import { RIGHT_TYPE_LABELS } from '@/features/analysis-report/format';
import { formatWon } from '@/features/properties/format';

export function DistributionSimulator({ rights }: { rights: Right[] }) {
  const [bidAmount, setBidAmount] = useState('');
  const amount = Number(bidAmount.replace(/[^0-9]/g, ''));
  const entries = amount > 0 ? calculateDistribution(rights, amount) : [];

  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">배당 시뮬레이터</h2>
      <input
        type="text"
        inputMode="numeric"
        placeholder="예상낙찰가 입력(원)"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {entries.length > 0 && (
        <table className="mt-4 w-full text-sm" data-testid="distribution-table">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">종류</th>
              <th className="py-1">청구액</th>
              <th className="py-1">배당액</th>
              <th className="py-1">부족액</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-1">{RIGHT_TYPE_LABELS[entry.right.type]}</td>
                <td className="py-1">{formatWon(entry.claimedAmount)}</td>
                <td className="py-1">{formatWon(entry.paidAmount)}</td>
                <td className="py-1">{entry.shortfall > 0 ? formatWon(entry.shortfall) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
