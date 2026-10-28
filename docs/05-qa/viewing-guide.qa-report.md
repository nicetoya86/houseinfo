---
template: qa-report
version: 2.1.1
feature: viewing-guide
date: 2026-10-28
verdict: QA_SKIP
passRate: N/A
criticalCount: 0
---

# QA Report: viewing-guide

> **Date**: 2026-10-28
> **Verdict**: QA_SKIP (환경 미구성으로 실행 불가 — 테스트 코드는 작성 완료)
> **Pass Rate**: N/A
> **Critical Issues**: 0
> **Feature**: viewing-guide

---

## 1. Test Summary

| Level | Type | Status | Pass Rate | Failed |
|-------|------|:------:|:---------:|:------:|
| L1 | Unit Test | Not Applicable | - | - |
| L2 | API Test | Written, Skipped | 0/2 실행 (4 skipped) | 0 |
| L3 | E2E Test | Written, Skipped | 0/2 실행 (위 4건에 포함) | 0 |
| L4 | UX Flow Test | Skipped (Chrome MCP 미연결) | - | - |
| L5 | Data Flow Test | Skipped (Chrome MCP 미연결) | - | - |

## 2. Failed Tests

없음 — 테스트가 실패한 게 아니라 전제조건(`.env.local` 미구성, 시드 데이터 없음)으로 `test.skip` 처리됨. 실제 pass/fail 신호는 아직 없음.

## 3. Critical Issues

없음.

## 4. Debug Analysis

- Pre-release 스캐너(`scripts/qa/pre-release-check.sh`)가 plugin 내부 `lib/qa` 모듈을 찾지 못해 실행 실패 (`MODULE_NOT_FOUND`) — 프로젝트 코드 문제 아닌 bkit 플러그인 스크립트 자체의 경로 버그로 판단, 참고용 INFO로만 기록
- `npx playwright test --list` → 4개 테스트 정상 파싱 확인
- `npx playwright test` 실행 → 4건 모두 `skipped` (크래시 없음, `test.skip` 조건 정상 동작)

## 5. Metrics

| Metric | Value |
|--------|-------|
| M11 QA Pass Rate | N/A (미실행) |
| M12 Test Coverage (L1) | 0% (단위 테스트 프레임워크 미설치, Design도 L1을 API 테스트로 정의해 해당 없음) |
| M13 E2E Coverage | 코드 작성 2/2 시나리오 (Design §8.4), 실행 0/2 |
| M14 Runtime Error Count | 0 (실행 자체를 안 했으므로 집계 불가) |
| M15 Data Flow Integrity | 미측정 |

## 6. Recommendations

1. `.env.local` 구성(Supabase/Kakao/Gemini 키) 후 `npm run dev` 기동
2. Supabase에 시드 데이터 2건 투입: 임장가이드 있는 매물(`PLAYWRIGHT_TEST_PROPERTY_ID`), 없는 매물(`PLAYWRIGHT_TEST_PROPERTY_ID_NO_GUIDE`)
3. `PLAYWRIGHT_BASE_URL`, 위 두 환경변수 설정 후 `npx playwright test` 재실행 → 실제 pass/fail 확인
4. bkit `pre-release-check.sh`의 `MODULE_NOT_FOUND`는 플러그인 측 이슈로 별도 보고 검토(사용자 프로젝트 영향 없음)

## 7. Chrome MCP Status

이 세션에 Chrome MCP 도구가 연결되어 있지 않음 → L3(브라우저 기반)·L4·L5 전부 skip. L2/L3 테스트 코드는 Playwright(`@playwright/test`, headless Chromium)로 작성해 Chrome MCP 없이도 추후 CLI로 직접 실행 가능.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-10-28 | Initial QA report — 테스트 코드 작성, 실행은 환경 구성 후로 보류 |
