// Design Ref: §5.3/§5.4 — 인피드 광고 자리. 실제 AdSense는 승인 후 연동 (placeholder only).
export function InFeedAdSlot() {
  return (
    <div
      data-testid="infeed-ad-slot"
      className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400"
    >
      광고
    </div>
  );
}
