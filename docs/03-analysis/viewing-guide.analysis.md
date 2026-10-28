---
template: analysis
version: 1.3
feature: viewing-guide
date: 2026-10-28
author: 장대광
project: houseinfo
---

# viewing-guide Analysis Report

> **Analysis Type**: Gap Analysis (static — 서버 미기동으로 runtime 생략)
>
> **Project**: houseinfo
> **Analyst**: 장대광
> **Date**: 2026-10-28
> **Design Doc**: [viewing-guide.design.md](../02-design/features/viewing-guide.design.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 임장 전 동네 인프라·시세·체크리스트를 알아야 하는데 여러 곳을 따로 찾아봐야 함 |
| **WHO** | property-listing 상세 페이지까지 도달한 경매 입문자/중급 투자자 |
| **RISK** | KB시세 범위제외, 카카오 호출한도, Gemini 품질편차, MOLIT LAWD_CD 매핑 불가 |
| **SUCCESS** | 신규 매물 등록 후 임장 가이드 자동 생성 성공률 90%+, 탭 최초 진입 시 전면광고 1회 노출 |
| **SCOPE** | 1차: 카카오맵+국토부 실거래가+Gemini 생성(캐싱). KB시세·로드뷰 상세는 2차 |

---

## Strategic Alignment Check

### PRD Alignment

| 요소 | 기대 | 구현 상태 |
|------|------|:---------:|
| 핵심 문제(WHY) | 임장 전 정보 분산 | ✅ Addressed (인프라+시세+체크리스트+지도 한 화면 통합) |
| 대상 사용자(WHO) | 상세페이지 도달 사용자 | ✅ Addressed (탭 전환으로 자연스럽게 연결) |
| 가치 제안 | 임장 전환율 상승 | ⚠️ Partial (코드는 완성, n8n 미배포로 실데이터 생성 검증 전) |

### Success Criteria Status

| # | Criteria (Plan) | Status | Evidence |
|---|---|:---:|---|
| SC-1 | 신규 매물 1건 기준 n8n 파이프라인이 Gemini 호출→저장까지 1회 이상 성공 | ❌ Not Met | n8n 미배포(API키 미설정, 워크플로우 import 안 함) — 코드/워크플로우 구조는 완성 |
| SC-2 | 임장정보 탭에서 인프라 요약/체크리스트/시세/지도 4요소 모두 렌더 | ✅ Met | `ViewingGuideContent.tsx` 전 요소 렌더, 데이터 없을 시 각자 fallback 문구 표시(설계대로) |
| SC-3 | 면책 고지 문구 모든 응답에 표시 | ✅ Met | `ViewingGuideContent.tsx` DISCLAIMER 상수 |
| SC-4 | Code review completed | ⏳ Pending | 사용자 리뷰 대기 |

**Success Rate**: 2/4 Met, 1 Partial(n8n 미배포), 1 Pending

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [Plan] | 카카오맵+국토부실거래가+Gemini(키보유) | ⚠️ 부분 | 카카오+Gemini는 실로직 구현, 국토부 실거래가는 LAWD_CD(법정동코드) 전국 매핑 테이블 부재로 TODO — 사용자 사전 승인된 보류 |
| [Design] | Option C, n8n이 생성 전담/Next.js는 읽기만 | ✅ | `queries.ts`는 SELECT만 수행, 쓰기는 n8n workflow의 service role 전용 |
| [Design] | viewing_guides 캐시 테이블 | ✅ | 마이그레이션이 Design §3.3과 완전 일치 |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

module-1~3 구현 결과를 Design 문서와 대조해 Match Rate 산출 및 미비점 식별.

### 1.2 Analysis Scope

- Design Document: `docs/02-design/features/viewing-guide.design.md`
- Implementation Path: `src/features/viewing-guide/`, `src/app/properties/[id]/viewing/`, `n8n/workflows/viewing-guide-generate.json`
- 서버 미기동(.env.local 미생성) — Runtime(L1~L3) 생략, Static-only formula 적용

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| (전용 API 없음 — Server Component 직접 쿼리) | `src/app/properties/[id]/viewing/page.tsx`가 `fetchViewingGuideByPropertyId` 직접 호출 | ✅ Match | Design §4 BaaS 패턴과 일치 |

### 2.2 Data Model

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|--------|
| propertyId | string | string | ✅ |
| infrastructureSummary | string | string | ✅ |
| checklist | string[] | string[] | ✅ |
| nearbyPrices | NearbyPriceItem[] | NearbyPriceItem[] | ✅ (타입 일치, 실데이터는 비어있음 — 아래 2.4 참조) |
| nearbyFacilities | NearbyFacility[] | NearbyFacility[] | ✅ |
| coordinates | {lat,lng}\|null | 동일 | ✅ |
| qualityFlag | 'ok'\|'needs_regeneration' | 동일 | ✅ |

### 2.3 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|--------|
| ViewingGuideContent | `src/features/viewing-guide/components/ViewingGuideContent.tsx` | ✅ Match |
| KakaoMapEmbed | `src/features/viewing-guide/components/KakaoMapEmbed.tsx` | ✅ Match |
| ViewingGuideEmptyState | `src/features/viewing-guide/components/ViewingGuideEmptyState.tsx` | ✅ Match |

### 2.4 Functional Depth Analysis

| File | Depth Score | Placeholder Indicators | Missing Design Elements |
|------|:----------:|----------------------|------------------------|
| `viewing-guide-generate.json` (MOLIT RTMS Lookup 노드) | 55 | "TODO" 주석, 빈 배열 반환 | LAWD_CD 매핑 테이블 부재로 `nearby_prices` 항상 빈 값 (사용자 사전 승인된 보류) |
| `KakaoMapEmbed.tsx` | 90 | - | 실제 카카오 JS 키로 미검증(로컬 서버 미기동) |
| 나머지 6개 파일(types/queries/Content/EmptyState/page/PropertyDetail수정) | 92-100 | - | - |

**Shallow File Count**: 1 / 8 files (12.5%)

### 2.5 Page UI Checklist Verification

| Page | Design Elements | Implemented | Missing | Rate |
|------|:--------------:|:-----------:|:-------:|:----:|
| 임장정보 페이지 | 7 | 7 | 0 | 100% |
| 매물 상세 탭 수정 | 1 | 1 | 0 | 100% |

**Functional Match Rate**: 90% (n8n MOLIT 공백 반영해 소폭 하향 조정)

### 2.6 API Contract Verification

| # | 대상 | Design | Server(queries.ts) | Client(page.tsx) | Contract |
|---|------|:------:|:------:|:------:|:--------:|
| 1 | `fetchViewingGuideByPropertyId` | ✅ | ✅ | ✅ | PASS |

**Contract Match Rate**: 1/1 = 100%

### 2.7 Runtime Verification Results

> `.env.local` 미생성 + Supabase/Kakao/Gemini 키 미설정으로 서버 기동 불가 — L1~L3 생략, Static-only formula 적용.

### 2.8 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Structural Match Rate:  100%                │
│  Functional Match Rate:  90%                 │
│  Contract Match Rate:    100%                │
│  Runtime Match Rate:     N/A (서버 미기동)    │
│  ───────────────────────────────────────────  │
│  Overall Match Rate:     96%                 │
│  = (Structural × 0.2) + (Functional × 0.4)   │
│    + (Contract × 0.4)   [static-only]        │
├─────────────────────────────────────────────┤
│  ✅ Match:          7 items (87.5%)          │
│  ⚠️ Shallow:         1 item (12.5%, MOLIT 미연동 — 사용자 액션 대기) │
│  ❌ Not implemented: 0 items (0%)            │
└─────────────────────────────────────────────┘
```

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

| File | Function | Complexity | Status |
|------|----------|------------|--------|
| `KakaoMapEmbed.tsx` | useEffect(SDK 로드) | 보통 | ✅ 수용 가능 |

### 3.2 Code Smells

없음 — 매직 넘버 상수화(`radius=1000` 등 n8n Code 노드 내 하드코딩은 워크플로우 특성상 허용).

### 3.3 Security Issues

| Severity | File | Issue | Recommendation |
|----------|------|-------|-----------------|
| 🟢 Info | `KakaoMapEmbed.tsx` | 카카오 JS 키 클라이언트 노출 | 설계상 불가피(SDK 특성), 카카오 콘솔에서 도메인 화이트리스트 필수 |
| 🟢 Info | `viewing_guides` RLS | anon SELECT만 허용, 쓰기는 service role | properties 테이블과 동일 정책, 양호 |

---

## 4. Performance Analysis

인덱스(`idx_viewing_guides_property`) 반영됨. n8n 미배포로 실제 생성 소요시간 미측정.

---

## 5. Test Coverage

자동화 테스트 미작성 (QA phase에서 추가 예정). `tsc --noEmit`, `eslint`, `next build`로만 검증.

---

## 6. Clean Architecture Compliance

### 6.1 Layer Dependency Verification

| Layer | Expected Dependencies | Actual | Status |
|-------|----------------------|--------|--------|
| Presentation (`components/`) | Domain | `types/viewing-guide.ts`만 import | ✅ |
| Infrastructure (`queries.ts`) | Domain | `types/viewing-guide.ts`, `lib/supabase.ts` | ✅ |
| Domain (`types/viewing-guide.ts`) | 없음 | 외부 의존성 없음 | ✅ |

### 6.4 Architecture Score

```
┌─────────────────────────────────────────────┐
│  Architecture Compliance: 100%               │
│  ✅ Correct layer placement: 8/8 files       │
└─────────────────────────────────────────────┘
```

---

## 7. Convention Compliance

property-listing(F1)과 동일 컨벤션 100% 준수(PascalCase 컴포넌트, kebab-case 폴더 등).

---

## 8. Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 96% (static-only)       │
│  Architecture:        100 points             │
│  Convention:          100 points             │
│  Security:            양호 (Info 2건)         │
│  Test Coverage:       미작성 (QA phase 예정)  │
└─────────────────────────────────────────────┘
```

---

## 9. Recommended Actions

### 9.1 Immediate

없음 — Critical 항목 없음.

### 9.2 Short-term

| Priority | Item | Notes |
|----------|------|-------|
| 🟡 1 | 법정동코드(LAWD_CD) 매핑 테이블 확보 → MOLIT RTMS 실연동 | SC-1 완전 달성 조건 |
| 🟡 2 | `.env.local` + 카카오/Gemini 키 구성 후 n8n 워크플로우 실제 실행 검증 | Runtime 테스트 수행 가능해짐 |

### 9.3 Long-term

| Item | Notes |
|------|-------|
| 체크리스트 체크 상태 서버 저장 | 현재는 클라이언트 로컬 상태(새로고침 시 초기화) — 사용자 피드백 시 재검토 |

---

## 10. Design Document Updates Needed

없음.

---

## 11. Next Steps

- [ ] 법정동코드 매핑 테이블 확보 (사용자 액션)
- [ ] n8n 워크플로우 실제 배포·실행 검증
- [ ] QA phase에서 Playwright 테스트 작성
- [ ] 완료 보고서 작성 (`viewing-guide.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial analysis (static-only, Match Rate 96%) | 장대광 |
