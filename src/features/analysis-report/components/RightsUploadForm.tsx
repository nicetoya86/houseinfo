'use client';
// Design Ref: §5.3/§5.4 — 등기부등본 업로드 + 로딩 상태, OCR 실패 시 재업로드 안내
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function RightsUploadForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ocr_failed' | 'error'>('idle');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    setStatus('loading');
    const form = new FormData();
    form.append('propertyId', propertyId);
    form.append('file', file);

    try {
      const response = await authFetch('/api/analysis-reports/upload', {
        method: 'POST',
        body: form,
      });
      if (response.status === 422) {
        setStatus('ocr_failed');
        return;
      }
      if (!response.ok) {
        setStatus('error');
        return;
      }
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mx-auto block text-sm"
        />
        <button
          type="submit"
          disabled={!file || status === 'loading'}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'loading' ? '분석 중...' : '등기부등본 업로드'}
        </button>
      </form>

      {status === 'ocr_failed' && (
        <p className="mt-4 text-sm text-amber-700">
          자동 추출에 실패했습니다. 등기부등본 내용을 다시 확인한 후 재업로드해 주세요.
        </p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-sm text-red-600">업로드 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
      )}
    </div>
  );
}
