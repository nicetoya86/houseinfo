---
template: report
version: 1.1
feature: analysis-report
date: 2026-10-31
project: houseinfo
---

# analysis-report Completion Report

> **Status**: Complete (Match Rate 92%, 90% 기준 통과)
> **PDCA Cycle**: #3 (module 1~3 권리분석)

## Executive Summary

| Item | Content |
|------|---------|
| Feature | analysis-report (F3 권리분석) |
| Match Rate | 86% → 92% (Act-1 1회) — Structural 92 / Functional 90 / Contract 95 |
| Tests | vitest 7/7 통과 (distribution 4 + baseRight 3) |

### Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | 낙찰 후 인수 권리(선순위 근저당·임차인 대항력) 수작업 분석 어려움. 등기부는 캡차로 자동 수집 불가 |
| Solution | 등기부 업로드 → Gemini Vision 권리 추출 → 말소기준권리·인수부담 순수함수 판단 → 배당표는 결정적 코드 계산 (AI는 설명문만) |
| Function/UX | 권리분석 탭에서 업로드 1회로 말소기준권리, 임차인 우선변제권 안내, 인수부담, 낙찰가 입력 시 배당표 즉시 재계산 |
| Core Value | 진입장벽 완화, 배당 숫자 재현성, 후속 수익화 진입점 |

## Implemented Files

- `src/types/analysis-report.ts`, `src/lib/gemini.ts`, `src/lib/supabaseAdmin.ts`
- `src/features/analysis-report/` — components 4종, `lib/distribution.ts`, `lib/baseRight.ts` (+tests), `queries.ts`, `format.ts`
- `src/app/api/analysis-reports/upload/route.ts`, `src/app/api/analysis-reports/[propertyId]/route.ts`
- `src/app/properties/[id]/analysis/page.tsx`
- `src/features/properties/components/PropertyDetail.tsx`, `src/app/properties/[id]/viewing/page.tsx` (탭 링크)
- `supabase/migrations/0003_analysis_reports.sql`, `0004_registry_documents_bucket.sql`

## Act-1 Fixes (7)

| ID | Fix |
|----|-----|
| D-01 | Storage 키 비ASCII 500 → MIME 기반 확장자 |
| G-01 | 재업로드 토글, 허위 "직접 입력" 문구 제거 (부분 해결) |
| G-02 | 임차인 우선변제권 안내 1줄 |
| G-05 | Gemini HTTP 오류 500 분류 |
| G-06 | 500 시 console.error |
| D-02 | OCR 타입가드 (`VALID_RIGHT_TYPES`/`isValidRight`) |
| D-03 | 배당 잔여분 claimedAmount 한도 내 이월 + 회귀 테스트 |

## Open Issues

- **SEC-1** API 라우트 인증 없음. 설계 §4.1은 1차 인증 "불필요(추후 Auth 연동 시 강화)"로 명시 — 의도적 연기. 등기부는 개인정보 + Gemini 외부 전송이라 운영 배포 전 필수 처리.
- G-01 추출 결과 전체 편집 폼 미구현 (재업로드로 대체)
- G-03 Playwright L2/L3, seed 미작성
- G-04 설명문이 OCR과 같은 호출에서 생성 (`ponytail:` 주석으로 한계 명시)
- D-04~D-08 Low/Trivial 6건 (formData try 밖, 고아 파일, 버킷명 하드코딩, server-only 가드, stale 주석)
- SC-1 실업로드 검증 보류 (env 없음), SC-4 코드리뷰 보류
- 빌드: env 없으면 실패. 원인 `src/lib/supabase.ts` import-time throw (F1 기존 코드). env 주입 시 성공.

## Next Steps

1. env 구성 후 SC-1 실업로드 검증
2. SEC-1 인증 방식 결정·적용
3. G-01 / G-03 / G-04 2차 작업
