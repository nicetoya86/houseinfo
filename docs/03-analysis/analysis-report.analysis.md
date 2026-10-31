---
template: analysis
version: 1.3
feature: analysis-report
date: 2026-10-29
author: 장대광
project: houseinfo
---

# analysis-report Analysis Report

> **Analysis Type**: Gap Analysis (static + 빌드/단위테스트 검증, 서버 미기동으로 runtime L2/L3 생략)
>
> **Project**: houseinfo
> **Analyst**: 장대광 (gap-detector)
> **Date**: 2026-10-29
> **Design Doc**: [analysis-report.design.md](../02-design/features/analysis-report.design.md)
> **Plan Doc**: [analysis-report.plan.md](../01-plan/features/analysis-report.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 권리분석은 경매의 핵심 리스크 판단 요소인데 수작업 분석이 어렵고 등기부등본 자동 수집도 불가능 |
| **WHO** | 중급 투자자(교차검증 필요), 경매 입문자 |
| **RISK** | OCR 추출 오류 → 면책고지 + 사용자 수정 폼으로 완화, 배당계산은 AI 아닌 결정적 코드 |
| **SUCCESS** | 업로드→분석 성공률 90%+, 배당표 100% 코드 계산, 동일 매물 캐시 응답 |
| **SCOPE** | 1차: PDF/이미지 업로드+OCR+결정적 배당계산+Gemini 설명. 실시간 등기부 자동조회는 범위 밖 |

---

## Strategic Alignment Check

### Success Criteria Status (Plan §4)

| # | Criteria | Status | Evidence |
|---|---|:---:|---|
| SC-1 | 샘플 1건 업로드→OCR→말소기준권리→배당표 1회 이상 성공 | ⏳ Not Verified | 코드 경로 완성, `.env.local` 없음 → 실 Gemini/Supabase 호출 미검증 |
| SC-2 | 배당액 합계 ≤ 예상낙찰가 | ✅ Met | `distribution.ts:19` `payable = min(remaining, totalClaim)`, 잔여분은 그룹 내 마지막 항목에 귀속(`:28-31`) → 그룹 합 = payable |
| SC-3 | 모든 응답에 면책 고지 | ✅ Met | `AnalysisReportContent.tsx:6-14` DISCLAIMER |
| SC-4 | Code review | ⏳ Pending | — |
| QC-1 | 배당 단위테스트 3 시나리오 | ✅ Met (Design 기준) | 3/3 pass. 단 Plan §4.2는 "임차인 포함" 시나리오 요구 → Design §8.2에서 "배당 부족"으로 대체됨(문서 간 drift) |
| QC-2 | Zero lint errors | ✅ Met | `eslint` 0 error / 0 warning |
| QC-3 | Build succeeds | ✅ Met (조건부) | env 주입 시 `next build` exit 0. env 없으면 `src/lib/supabase.ts:8`(F1 기존 코드) throw로 실패 |

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [Design §2.0] | Option C (features 모듈 + 순수함수 분리) | ✅ | — |
| [Design §1.1] | 추출→확인/수정→확정 2단계 플로우 | ❌ | 확인/수정 단계(RightsExtractionReview) 미구현 — G-01 |
| [Design §1.2] | 계산=결정적, 설명만 AI | ⚠️ | 계산은 결정적. 단 설명문이 말소기준권리 판단 **전에** OCR과 같은 호출에서 생성됨 — G-04 |
| [Design §4] | 전용 API 라우트만 접근, 클라 직접 쿼리 금지 | ✅ | 클라이언트는 `/api/analysis-reports/upload`만 호출, 페이지는 Server Component에서 service role 조회 |

---

## 1. Analysis Overview

### 1.1 Analysis Scope

- Design: `docs/02-design/features/analysis-report.design.md` (§2~§9 전체)
- Implementation: `src/types/analysis-report.ts`, `src/lib/{supabaseAdmin,gemini}.ts`, `src/features/analysis-report/**`, `src/app/api/analysis-reports/**`, `src/app/properties/[id]/analysis/page.tsx`, `PropertyDetail.tsx`, `viewing/page.tsx`, `supabase/migrations/0003,0004`
- 제외(의도된 차이, Gap 아님): 업로드/GET Auth 미적용(Design §4.1), `quality_flag` 어휘 테이블별 상이, n8n MOLIT 자동조회(SCOPE 밖)

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Data Model (§3)

| 항목 | Design | Impl | Status |
|------|--------|------|:------:|
| RightType / Right / TenantInfo / AnalysisReport / DistributionEntry | §3.1 | `src/types/analysis-report.ts:3-38` | ✅ 필드·타입 100% 일치 |
| `analysis_reports` DDL·인덱스·RLS | §3.3 | `0003_analysis_reports.sql:2-23` | ✅ 완전 일치 |
| Storage 비공개 버킷 `registry-documents` | §3.3 주석 | `0004_registry_documents_bucket.sql:2-8` | ✅ (Design §11.1 파일목록에 0004 미기재 → 문서 갱신) |

### 2.2 API (§4, §6)

| Endpoint / Case | Design | Impl | Status |
|------|--------|------|:------:|
| POST upload 201 | `{data:{id,propertyId,rights,baseRightIndex,assumedBurdens,explanationText}}` | `upload/route.ts:80` 전체 AnalysisReport 반환(상위집합, `sourceFilePath` 포함) | ✅ (superset) |
| POST 400 | 파일 누락/형식 | `route.ts:17-28` INVALID_UPLOAD, 타입·10MB 제한 | ✅ |
| POST 422 | needs_review 저장 + 에러 포맷 | `route.ts:41-62` | ✅ |
| POST 500 | Gemini/Storage 오류 → 500 + **로깅** | `route.ts:81-86` 500 반환, 로깅 없음. Gemini HTTP 오류는 `gemini.ts:62` null → 422로 분류 | ⚠️ G-05, G-06 |
| GET `/:propertyId` | 캐시 or `{data:null}` | `[propertyId]/route.ts:9-18` | ✅ (UI 미사용 — 페이지는 queries 직접 호출) |
| 에러 포맷 `{error:{code,message,details?}}` | §6.2 | 일치 | ✅ |

### 2.3 Component Structure (§2.3, §5.3, §11.1)

| Design Component | Impl | Status |
|------------------|------|:------:|
| RightsUploadForm | `components/RightsUploadForm.tsx` | ✅ |
| AnalysisReportSummary | `components/AnalysisReportSummary.tsx` | ✅ |
| DistributionSimulator | `components/DistributionSimulator.tsx` | ✅ |
| AnalysisReportContent | `components/AnalysisReportContent.tsx` | ✅ |
| **RightsExtractionReview** (§2.3) | — | ❌ G-01 |
| distribution.ts / baseRight.ts + tests | `lib/*` | ✅ |
| queries.ts, gemini.ts, page, 2 routes | 존재 | ✅ |
| (추가) `format.ts`, `supabaseAdmin.ts` | Design 미기재 | 🟡 Added (정당한 보조 파일, 문서 반영 권장) |

### 2.4 Page UI Checklist (§5.4)

| Page | Items | Impl | Partial | Missing | Rate |
|------|:-----:|:----:|:------:|:-------:|:----:|
| 캐시 없음 | 4 | 3 | 1 ("직접 입력" 안내 문구는 있으나 직접 입력 수단 없음) | 0 | 88% |
| 캐시 있음 | 7 | 6 | 1 (우선변제권 안내 없음, 대항력만) | 0 | 93% |
| 탭 네비게이션(상세/임장 페이지) | 2 | 2 | 0 | 0 | 100% |

### 2.5 Differences Found

#### 🔴 Missing (Design O, Impl X)

| ID | Item | Design Location | Description | Severity | Status |
|----|------|-----------------|-------------|:--------:|:------:|
| G-01 | 추출결과 확인/수정 폼 (RightsExtractionReview) | §1.1, §2.3, §4.2(422 "사용자 수동 입력 유도"), Plan §5 Risk#1 | **최소 구현 완료**(2026-10-29): "다시 업로드"(`?reupload=1`) 토글로 캐시 있어도 재업로드 가능. 존재하지 않는 "직접 입력" 문구 제거. 단 추출 결과를 직접 편집하는 전체 편집 폼은 여전히 미구현 — 재업로드 워크어라운드로 대체 | High | 🟡 Partially Resolved |
| G-02 | 우선변제권 안내 | §5.4 "임차인 대항력/우선변제권 안내" | **해결**(2026-10-29): confirmedDate 존재 시 "우선변제권 기준일" 한 줄 안내 추가(간이 분석) | Low | ✅ Resolved |
| G-03 | L2/L3 Playwright 테스트, Seed 데이터 | §8.3~§8.5 | `tests/e2e/`에 analysis 스펙 없음, seed 없음 — iterate 범위 밖, 별도 작업 필요 | Medium | ⏳ Open |

#### 🔵 Changed (Design ≠ Impl)

| ID | Item | Design | Impl | Severity | Status |
|----|------|--------|------|:--------:|:------:|
| G-04 | 설명문 생성 순서 | §2.2: determineBaseRight → Gemini(설명만) | `gemini.ts:53-55`에 `ponytail:` 주석으로 한계 명시(단일 호출에서 OCR+설명 동시 생성). 2차 호출 분리는 범위 밖 | Medium | ⏳ Open (documented) |
| G-05 | Gemini 장애 분류 | §6.1: Gemini 오류 → 500 | **해결**(2026-10-29): `!response.ok` → throw로 변경, 500 INTERNAL_ERROR로 정확히 분류(422/needs_review 오염 제거) | Medium | ✅ Resolved |
| G-06 | 500 에러 로깅 | §6.1 "에러 로깅" | **해결**(2026-10-29): 두 라우트 catch에 `console.error` 추가 | Low | ✅ Resolved |

#### 🟠 Implementation Defects (설계 일치 여부와 별개)

| ID | File:Line | Issue | Severity | Status |
|----|-----------|-------|:--------:|:------:|
| D-01 | `upload/route.ts:44` | Storage key 비ASCII 파일명 500 문제 | High | ✅ Resolved(2026-10-29) — `getFileExtension()`로 MIME/안전 확장자만 사용 |
| D-02 | `gemini.ts:25-43` | OCR JSON 검증 없이 신뢰하던 문제 | Medium | ✅ Resolved(2026-10-29) — `VALID_RIGHT_TYPES`+`isValidRight()` 타입가드 |
| D-03 | `distribution.ts:27-37` | 잔여분 마지막 항목 쏠림으로 `paidAmount > claimedAmount` 가능하던 문제 | Low | ✅ Resolved(2026-10-29) — claimedAmount 한도 내 이월 배정 + 회귀 테스트 |
| D-04 | `upload/route.ts:13` | `request.formData()`가 try 밖 → 비 multipart 요청 시 미처리 예외 | Low | ⏳ Open |
| D-05 | `upload/route.ts:34-37` | propertyId 존재 확인 전 Storage 업로드 → FK 실패 시 고아 파일. 재업로드 시 이전 파일도 고아로 남음 | Low | ⏳ Open |
| D-06 | `upload/route.ts:10` | 버킷명을 `SUPABASE_STORAGE_BUCKET` env로 바꿀 수 있으나 `0004` 정책은 `registry-documents` 하드코딩 | Low | ⏳ Open |
| D-07 | `supabaseAdmin.ts:1` | `import 'server-only'` 가드 없음 → 클라이언트 번들 오import 시 빌드타임 차단 안 됨(현재 오import 없음) | Low | ⏳ Open |
| D-08 | `PropertyDetail.tsx:1` | 주석 "권리분석은 비활성" stale | Trivial | ⏳ Open |

### 2.6 Recently Changed Items — Verification

| Change | Result |
|--------|--------|
| `supabaseAdmin.ts` lazy Proxy init | ✅ import 시 throw 제거 확인, `next build`에서 analysis 라우트 page-data 수집 통과. 함수 bind 처리 정상 |
| `gemini.ts` `x-goog-api-key` 헤더 | ✅ URL에 키 없음(`gemini.ts:47-49`) |
| `distribution.ts` 잔여분 귀속 | ✅ 그룹 합 = payable 보장(SC-2). D-03 엣지케이스·테스트 누락만 잔존 |
| 탭 링크 활성화 | ✅ `PropertyDetail.tsx:19-24`, `viewing/page.tsx:29-34`, `analysis/page.tsx:22-35` |

### 2.7 Match Rate Summary

```
[Initial, 2026-10-29 pre-iterate]
Structural Match Rate:  92%  (12/13, RightsExtractionReview 누락)
Functional Match Rate:  80%  (2단계 검증 플로우 부재, 우선변제 누락, 설명 순서)
Contract Match Rate:    90%  (Gemini 오류 422/500 분류, 로깅)
Runtime Match Rate:     N/A  (env 미구성)
Overall Match Rate:     86%  = Structural×0.2 + Functional×0.4 + Contract×0.4 [static-only]

[Post-iterate, 2026-10-29 — Act-1 완료 후 gap-detector 재실행으로 확정]
Structural Match Rate:  92%  (변동 없음 — RightsExtractionReview 전체 편집 폼 자체는 여전히 미구현)
Functional Match Rate:  90%  (G-02/D-03 해결, G-01 부분 해결. G-04는 남음)
Contract Match Rate:    95%  (G-05/G-06/D-02 해결)
Overall Match Rate:     92%  = 92×0.2 + 90×0.4 + 95×0.4 — 90% 기준 통과
```

---

## 3. Code Quality / Security

| Severity | Item | Notes |
|----------|------|-------|
| 🟢 OK | RLS | `analysis_reports` USING(false), 버킷 비공개 + service_role 정책 — Design §7 일치 |
| 🟢 OK | 업로드 제한 | PDF/JPG/PNG, 10MB 서버 검증(`route.ts:8-9,23`) |
| 🟢 OK | API 키 | Gemini 키 헤더 전송, service role 키 서버 전용 |
| 🟡 Medium | OCR 출력 검증 부재 | D-02 |
| 🟢 Info | MIME | 클라이언트 제공 `file.type` 신뢰 — 1차 범위 허용 |

---

## 4. Test & Build Verification (2026-10-29 실행)

| Check | Result |
|-------|--------|
| `npx vitest run` | ✅ exit 0 — 2 files, 6/6 pass (distribution 3, baseRight 3). Vite `configLoader` 경고 1건(무해) |
| `npx tsc --noEmit` | ✅ exit 0, 0 errors |
| `npx eslint` | ✅ exit 0, 0 errors / 0 warnings |
| `npx next build` | ⚠️ env 없으면 exit 1 (`src/lib/supabase.ts:8` F1 클라이언트 import-time throw, `/api/properties` page-data 단계). 더미 env 주입 시 ✅ exit 0, `/properties/[id]/analysis`, `/api/analysis-reports/upload`, `/api/analysis-reports/[propertyId]` 모두 ƒ(dynamic) |
| L2/L3 Playwright | ❌ 미작성 (G-03) |
| `.env.example` | ❌ 없음 — 필요 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`(선택), `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `SUPABASE_STORAGE_BUCKET`(선택) |

---

## 5. Clean Architecture Compliance

| Layer | Expected | Actual | Status |
|-------|----------|--------|:------:|
| Domain `types/analysis-report.ts` | 의존 없음 | 없음 | ✅ |
| Application `lib/distribution.ts`, `baseRight.ts` | Domain만 | Domain만, 순수함수 | ✅ |
| Presentation `components/*` | Application, Domain | lib/format/types만, 클라 컴포넌트에서 Infra import 없음 | ✅ |
| Infrastructure `queries.ts`, `gemini.ts`, routes | Domain | Domain + supabaseAdmin | ✅ |

Architecture 100%. Convention: PascalCase 컴포넌트, camelCase 유틸, UPPER_SNAKE 상수, kebab-case 폴더 — 100% (기존 `viewing/page.tsx:23` `<a>` vs `Link` 혼용은 F2 기존 코드).

---

## 6. Recommended Actions

### 6.1 Immediate (iterate 대상)

| Priority | ID | Action |
|:--:|----|--------|
| 1 | D-01 | Storage 키를 ASCII로: `${propertyId}/${Date.now()}.${ext}` (ext는 MIME에서 파생) |
| 2 | G-01 | 최소안: 캐시 존재 시에도 "다시 업로드" 노출 + 422 문구에서 "직접 입력" 제거. 완전안: 추출 rights 편집 폼 + 저장 API(PATCH) |
| 3 | G-05/G-06 | Gemini HTTP 오류는 throw → 500, catch에 `console.error` |
| 4 | D-02 | `parseJsonResponse`에서 type 화이트리스트·숫자 필드 필터링, 불량 항목 제외 시 needs_review |

### 6.2 Short-term

| ID | Action |
|----|--------|
| G-04 | 설명문을 baseRight/assumedBurdens 계산 후 2차 Gemini 호출로 생성(또는 결정적 결과를 프롬프트에 주입) — 또는 Design을 "단일 호출"로 갱신 |
| G-03 | `tests/e2e/analysis-report-*.spec.ts` + seed 1건 |
| D-03 | 잔여분 테스트 추가(예: 동순위 3건, 홀수 payable → 합계 == payable, shortfall ≥ 0) |
| G-02 | 확정일자 기반 우선변제권 안내 1줄 추가 |
| — | `.env.example` 추가 |

### 6.3 Design Document Updates Needed

- §11.1 파일 목록에 `0004_registry_documents_bucket.sql`, `format.ts`, `AnalysisReportContent.tsx`, `src/lib/supabaseAdmin.ts` 추가
- §4.2 POST 201 응답을 전체 AnalysisReport로 갱신(또는 구현 축소)
- §8.2와 Plan §4.2 "임차인 포함 시나리오" 불일치 정리

---

## 7. Next Steps

- [ ] `/pdca iterate analysis-report` (Match Rate 86% < 90%)
- [ ] `.env.local` 구성 후 SC-1 실업로드 검증
- [ ] Playwright L2/L3 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-29 | Initial analysis (static + build/unit verification, Match Rate 86%) | 장대광 |
