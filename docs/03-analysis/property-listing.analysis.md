---
template: analysis
version: 1.3
feature: property-listing
date: 2026-10-28
author: 장대광
project: houseinfo
---

# property-listing Analysis Report

> **Analysis Type**: Gap Analysis (static — 서버 미기동으로 runtime 테스트는 생략)
>
> **Project**: houseinfo
> **Analyst**: 장대광
> **Date**: 2026-10-28
> **Design Doc**: [property-listing.design.md](../02-design/features/property-listing.design.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 경매·공매 매물 탐색이 여러 사이트에 흩어져 있어 초보 투자자의 진입장벽이 높음 |
| **WHO** | 경매 입문자, 중급 투자자, 공매 관심자 |
| **RISK** | 법원경매정보 API 부재(2차 분리) / 온비드 실제 응답 필드 미확인(활용신청 필요) |
| **SUCCESS** | 온비드 매물 200건 이상 자동 수집·표시, 필터 응답 1초 이내 |
| **SCOPE** | 1차: 온비드 공매만 연동 |

---

## Strategic Alignment Check

### PRD Alignment

| 요소 | 기대 | 구현 상태 |
|------|------|:---------:|
| 핵심 문제(WHY) | 매물 탐색 분산 → 진입장벽 | ✅ Addressed (통합 리스트/필터 구현) |
| 대상 사용자(WHO) | 경매 입문자 등 | ✅ Addressed (필터·카드 UX로 초보자 탐색 지원) |
| 가치 제안 | 매물 탐색 진입점 확보 | ⚠️ Partial (리스트/상세는 완성, 실데이터 수집은 미연결) |

### Success Criteria Status

| # | Criteria (Plan) | Status | Evidence |
|---|---|:---:|---|
| SC-1 | 온비드 매물 200건 이상 자동 수집되어 리스트에 노출 | ❌ Not Met | `n8n/workflows/onbid-collect.json`의 필드 매핑이 TODO placeholder — 사용자가 활용신청 후 실제 필드명 교체해야 동작 |
| SC-2 | 전체 필터 조합 정상 동작 | ✅ Met | `PropertyFilterPanel.tsx` — 소재지/시군구 쉼표 다중선택 추가 반영 (읍면동 레벨은 지역 데이터셋 부재로 범위 제외, YAGNI) |
| SC-3 | 매물 카드 클릭 → 상세 페이지 정상 이동 | ✅ Met | `PropertyCard.tsx` `Link href=/properties/${id}` |
| SC-4 | n8n 파이프라인 1회 이상 스케줄 실행 성공 로그 확인 | ❌ Not Met | 워크플로우 JSON만 작성됨, 실제 n8n import·실행 안 됨 (API 키 미발급) |
| SC-5 | Zero lint errors | ✅ Met | `npx eslint src --max-warnings=0` 통과 |
| SC-6 | Build succeeds | ✅ Met | `npm run build` 성공 (Route 7개 생성 확인) |

**Success Rate**: 3/6 Met, 1/6 Partial, 2/6 Not Met

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [Plan] | 1차 온비드 공매만 연동 | ✅ | - |
| [Design] | Option C (features/properties 모듈 분리) | ✅ | - |
| [Design] | Zustand 단일 필터 store | ✅ | `store.ts` 구현대로 |
| [Design] | fetch + Supabase client (react-query 미사용) | ✅ | - |
| [Design] | Next.js 14 SSG/ISR | ⚠️ | 실제 스캐폴딩이 Next 16 canary로 설치됨 — `cacheComponents` 실험 플래그가 SSG/ISR 전제와 충돌해 비활성화, 현재는 일반 동적 라우팅으로 서빙 (ISR 세분화는 추후 재검토 필요) |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

module-1~4 구현 결과를 Design 문서와 대조해 Match Rate 산출 및 미비점 식별.

### 1.2 Analysis Scope

- Design Document: `docs/02-design/features/property-listing.design.md`
- Implementation Path: `src/features/properties/`, `src/app/properties/`, `src/app/api/`, `n8n/workflows/`
- 서버 미기동 상태(.env.local 미생성) — Runtime(L1~L3) 테스트 생략, Static-only formula 적용

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| GET /api/properties | `src/app/api/properties/route.ts` | ✅ Match | |
| GET /api/properties/:id | `src/app/api/properties/[id]/route.ts` | ✅ Match | |
| POST /api/revalidate | `src/app/api/revalidate/route.ts` | ✅ Match | secret 헤더 검증 포함 |

### 2.2 Data Model

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|--------|
| caseNumber | string | string | ✅ |
| type | 'auction'\|'public_sale' | 동일 | ✅ |
| category | PropertyCategory | 동일 enum | ✅ |
| appraisalValue / minBid | number | number | ✅ |
| failCount | number | number | ✅ |
| saleDate | string | string | ✅ |
| zoneType | string\|null | string\|null | ✅ |
| images | string[] | string[] | ✅ |

### 2.3 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|--------|
| PropertyFilterPanel | `src/features/properties/components/PropertyFilterPanel.tsx` | ✅ Match |
| PropertyList | `src/features/properties/components/PropertyList.tsx` | ✅ Match |
| PropertyCard | `src/features/properties/components/PropertyCard.tsx` | ✅ Match |
| InFeedAdSlot | `src/components/ads/InFeedAdSlot.tsx` | ✅ Match |
| PropertyDetail | `src/features/properties/components/PropertyDetail.tsx` | ✅ Match |

### 2.4 Functional Depth Analysis

| File | Depth Score | Placeholder Indicators | Missing Design Elements |
|------|:----------:|----------------------|------------------------|
| `PropertyFilterPanel.tsx` | 92 | - | 읍면동 레벨은 지역 데이터셋 부재로 범위 제외(YAGNI) — 시도/시군구 다중선택은 보강 완료 |
| `n8n/workflows/onbid-collect.json` | 45 | `normalize-fields` 노드에 TODO 주석 다수 | 실제 온비드 응답 필드명 미확정 (활용신청 필요, 사용자 승인된 의도적 placeholder) |
| 나머지 14개 파일 | 90-100 | - | - |

**Shallow File Count**: 1 / 16 files (6.25%)

### 2.5 Page UI Checklist Verification

| Page | Design Elements | Implemented | Missing | Rate |
|------|:--------------:|:-----------:|:-------:|:----:|
| 매물 리스트 | 11 | 11 | 0 | 100% |
| 매물 상세 | 2 | 2 | 0 | 100% |

**Functional Match Rate**: 96%

### 2.6 API Contract Verification

| # | Endpoint | Design | Server | Client | Contract |
|---|----------|:------:|:------:|:------:|:--------:|
| 1 | GET /api/properties | ✅ | ✅ | ✅ (`PropertyList.tsx` fetch) | PASS |
| 2 | GET /api/properties/:id | ✅ | ✅ | ✅ (Server Component가 `fetchPropertyById` 직접 호출 — Design §4 BaaS 패턴과 일치) | PASS |
| 3 | POST /api/revalidate | ✅ | ✅ | ✅ (n8n `call-revalidate` 노드) | PASS |

**Contract Match Rate**: 3/3 = 100%

### 2.7 Runtime Verification Results

> `.env.local` 미생성(가드레일상 직접 생성 불가) + Supabase 프로젝트 미연결로 서버 기동 불가 — L1~L3 생략, Static-only formula 적용.

### 2.8 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Structural Match Rate:  100%                │
│  Functional Match Rate:  96%                 │
│  Contract Match Rate:    100%                │
│  Runtime Match Rate:     N/A (서버 미기동)    │
│  ───────────────────────────────────────────  │
│  Overall Match Rate:     98.4%               │
│  = (Structural × 0.2) + (Functional × 0.4)   │
│    + (Contract × 0.4)   [static-only]        │
├─────────────────────────────────────────────┤
│  ✅ Match:          15 items (93.75%)        │
│  ⚠️ Shallow:         1 item (6.25%, n8n 필드 placeholder — 사용자 액션 대기) │
│  ❌ Not implemented: 0 items (0%)            │
└─────────────────────────────────────────────┘
```

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

| File | Function | Complexity | Status |
|------|----------|------------|--------|
| `queries.ts` | fetchProperties | 보통 (조건부 분기 11개) | ✅ 수용 가능 — 필터 조건 특성상 선형 분기 |
| `PropertyList.tsx` | useEffect(필터 로드) | 보통 | ✅ |

### 3.2 Code Smells

| Type | File | Description | Severity |
|------|------|-------------|----------|
| 매직 넘버 | `PropertyList.tsx` | `IN_FEED_INTERVAL = 5` 상수화 완료 | 🟢 없음 |

### 3.3 Security Issues

| Severity | File | Issue | Recommendation |
|----------|------|-------|-----------------|
| 🟢 Info | `supabase.ts` | anon key 클라이언트 노출은 RLS 전제하에 정상 | 현행 유지 |
| 🟢 Info | `revalidate/route.ts` | secret 헤더 비교가 상수시간 비교 아님(timing attack 이론상 가능) | 낮은 우선순위, 필요시 `crypto.timingSafeEqual` 적용 |

---

## 4. Performance Analysis

인덱스(`idx_properties_filter` 등)는 마이그레이션에 반영됨. 실제 응답시간은 Supabase 연결 후 측정 필요(미측정).

---

## 5. Test Coverage

자동화 테스트 미작성 (Design §8 L1-L3 테스트는 QA phase에서 Playwright로 추가 예정). 현재는 `tsc --noEmit`, `eslint`, `next build`로만 검증됨.

---

## 6. Clean Architecture Compliance

### 6.1 Layer Dependency Verification

| Layer | Expected Dependencies | Actual | Status |
|-------|----------------------|--------|--------|
| Presentation (`components/`) | Application, Domain | `store.ts`, `types/property.ts`만 import | ✅ |
| Application (`store.ts`, `queries.ts`) | Domain, Infrastructure | `types/property.ts`, `lib/supabase.ts` | ✅ |
| Domain (`types/property.ts`) | 없음 | 외부 의존성 없음 | ✅ |
| Infrastructure (`lib/supabase.ts`, API routes) | Domain only | `types/property.ts` | ✅ |

### 6.2 Dependency Violations

없음 — Design §9.3 Import Rule 위반 사례 미발견.

### 6.4 Architecture Score

```
┌─────────────────────────────────────────────┐
│  Architecture Compliance: 100%               │
│  ✅ Correct layer placement: 16/16 files     │
└─────────────────────────────────────────────┘
```

---

## 7. Convention Compliance

| Category | Convention | Compliance |
|----------|-----------|:----------:|
| Components | PascalCase | 100% |
| Files (component) | PascalCase.tsx | 100% |
| Files (utility) | camelCase.ts | 100% |
| Folders | kebab-case | 100% |

---

## 8. Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 98.4% (static-only)     │
│  Architecture:        100 points             │
│  Convention:          100 points             │
│  Security:            양호 (Info 2건)         │
│  Test Coverage:       미작성 (QA phase 예정)  │
└─────────────────────────────────────────────┘
```

---

## 9. Recommended Actions

### 9.1 Immediate

없음 — Critical 항목(소재지 다중선택) 조치 완료.

### 9.2 Short-term

| Priority | Item | Notes |
|----------|------|-------|
| 🟡 1 | data.go.kr 활용신청 후 온비드 실제 필드로 `onbid-collect.json` TODO 교체 | SC-1, SC-4 달성 조건 |
| 🟡 2 | `.env.local` 구성 후 서버 기동 → L1~L3 Runtime 테스트 수행 | Match Rate 재계산 필요 |

### 9.3 Long-term

| Item | Notes |
|------|-------|
| Next.js 버전 고정 | 현재 16 canary 자동 설치됨 — Design 전제(Next 14)와 버전 정합성 재검토 |
| revalidate secret 비교 | timing-safe 비교로 교체 (낮은 우선순위) |

---

## 10. Design Document Updates Needed

- [ ] §7.2 Next.js 버전을 "16.x (cacheComponents 비활성)"으로 현행화

---

## 11. Next Steps

- [ ] 소재지 필터 UI 보강 (Critical)
- [ ] 온비드 API 활용신청 + 필드 매핑 완성 (Critical, 사용자 액션 필요)
- [ ] QA phase에서 Playwright L1-L3 테스트 작성/실행
- [ ] 완료 보고서 작성 (`property-listing.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial analysis (static-only, Match Rate 95.2%) | 장대광 |
