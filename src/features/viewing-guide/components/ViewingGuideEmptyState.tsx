// Design Ref: §5.3/§6.1 — 캐시 미스는 에러가 아니라 생성 준비중 안내
export function ViewingGuideEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      임장 가이드 생성 준비중입니다. 잠시 후 다시 확인해 주세요.
    </div>
  );
}
