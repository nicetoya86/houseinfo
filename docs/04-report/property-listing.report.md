---
template: report
version: 1.1
feature: property-listing
date: 2026-10-28
author: 장대광
project: houseinfo
---

# property-listing Completion Report

> **Status**: Complete (1차 범위 — 온비드 공매만)
>
> **Project**: houseinfo
> **Version**: 0.1.0
> **Author**: 장대광
> **Completion Date**: 2026-10-28
> **PDCA Cycle**: #1

---

## Executive Summary

### 1.1 Project Overview

| Item | Content |
|------|---------|
| Feature | property-listing (F1 매물 조회 & 필터) |
| Start Date | 2026-10-28 |
| End Date | 2026-10-28 |
| Duration | 1 세션 (Plan→Design→Do×4모듈→Check) |

### 1.2 Results Summary

```
┌─────────────────────────────────────────────┐
│  Completion Rate: 98.4% (Match Rate)         │
├─────────────────────────────────────────────┤
│  ✅ Complete:     15 / 16 structural items   │
│  ⏳ 사용자 액션 대기: 1 / 16 (n8n 필드매핑)   │
│  ❌ Cancelled:     0 / 16 items               │
└─────────────────────────────────────────────┘
```

### 1.3 Value Delivered

| Perspective | Content |
|-------------|---------|
| **Problem** | 경매·공매 매물 탐색이 여러 사이트에 분산되어 초보 투자자의 진입장벽이 높았음 |
| **Solution** | 온비드 API → n8n → Supabase 수집 파이프라인 + Next.js 다중 필터 리스트/상세 페이지로 한 곳에 통합 |
| **Function/UX Effect** | 소재지(다중선택)·물건종류·감정가·최저가·유찰횟수·매각기일·용도지역 7종 필터 + 무한스크롤 + 5번째 카드마다 인피드 광고. 타입체크/lint/build 전부 통과 |
| **Core Value** | 매물 탐색 진입점을 완성해 F2(임장정보)·F3(권리분석) 확장의 기반을 마련함 |

---

## 1.4 Success Criteria Final Status

| # | Criteria | Status | Evidence |
|---|---------|:------:|----------|
| SC-1 | 온비드 매물 200건 이상 자동 수집되어 리스트에 노출 | ⏳ 보류 | `n8n/workflows/onbid-collect.json` 구조 완성, 필드 매핑은 data.go.kr 활용신청 후 사용자가 직접 교체 필요 |
| SC-2 | 전체 필터 조합 정상 동작 | ✅ Met | `PropertyFilterPanel.tsx` — 7종 필터 전부 구현, 소재지/시군구 다중선택 포함 |
| SC-3 | 매물 카드 클릭 → 상세 페이지 정상 이동 | ✅ Met | `PropertyCard.tsx`의 `Link` 라우팅 |
| SC-4 | n8n 파이프라인 1회 이상 스케줄 실행 성공 로그 확인 | ⏳ 보류 | API 키 미발급으로 미실행 — SC-1과 동일 원인 |
| SC-5 | Zero lint errors | ✅ Met | `npx eslint src --max-warnings=0` 통과 |
| SC-6 | Build succeeds | ✅ Met | `npm run build` 성공, 7개 라우트 생성 확인 |

**Success Rate**: 4/6 criteria met (67%), 2건은 사용자의 외부 계정 작업(API 활용신청) 선행 필요로 보류

## 1.5 Decision Record Summary

| Source | Decision | Followed? | Outcome |
|--------|----------|:---------:|---------|
| [Plan] | 1차는 온비드 공매만 연동, 법원경매는 2차 분리 | ✅ | 범위 내 모든 구현이 공매 전제로 일관되게 완료 |
| [Design] | Option C 실용균형 (features/properties 모듈 분리) | ✅ | Clean Architecture 점검 결과 레이어 위반 0건 |
| [Design] | Zustand 단일 필터 store, fetch+Supabase(react-query 미사용) | ✅ | `store.ts`/`queries.ts`로 그대로 구현 |
| [Design] | Next.js 14 SSG/ISR 전제 | ⚠️ 부분 변경 | 실제 스캐폴딩이 Next 16 canary로 설치되어 `cacheComponents` 실험 플래그와 충돌 → 비활성화하고 일반 동적 라우팅으로 전환 (기능 영향 없음, 버전 재검토 필요) |

---

## 2. Related Documents

| Phase | Document | Status |
|-------|----------|--------|
| Plan | [property-listing.plan.md](../01-plan/features/property-listing.plan.md) | ✅ Finalized |
| Design | [property-listing.design.md](../02-design/features/property-listing.design.md) | ✅ Finalized |
| Check | [property-listing.analysis.md](../03-analysis/property-listing.analysis.md) | ✅ Complete (98.4%) |
| Act | 본 문서 | ✅ 작성 완료 |

---

## 3. Completed Items

### 3.1 Functional Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| FR-01 | n8n 온비드 수집→Supabase upsert | ⏳ 구조 완성, 필드매핑 사용자 교체 대기 | `n8n/workflows/onbid-collect.json` |
| FR-02 | 7종 필터(소재지/종류/감정가/최저가/유찰횟수/매각기일/용도지역) | ✅ Complete | |
| FR-03 | 매물 카드(사건번호/소재지/감정가/최저가/유찰/매각기일/사진) | ✅ Complete | |
| FR-04 | 상세 페이지 기본정보 탭 | ✅ Complete | 임장/권리분석/지도 탭은 F2/F3용 비활성 placeholder |
| FR-05 | 인피드 광고(5번째 카드마다) | ✅ Complete | 실제 AdSense 연동은 승인 후 |
| FR-06 | ISR revalidate 웹훅 | ✅ Complete | `/api/revalidate` secret 인증 |

### 3.2 Non-Functional Requirements

| Item | Target | Achieved | Status |
|------|--------|----------|--------|
| 필터 인덱스 | 쿼리 인덱스 적용 | `idx_properties_filter` 등 4개 인덱스 | ✅ |
| Zero lint errors | 0 | 0 | ✅ |
| Build | 성공 | 성공 (7 routes) | ✅ |
| 응답시간 1초 이내 | < 1s | 미측정 (Supabase 미연결) | ⏳ |

### 3.3 Deliverables

| Deliverable | Location | Status |
|-------------|----------|--------|
| DB 마이그레이션 | `supabase/migrations/0001_properties.sql` | ✅ |
| 타입/쿼리/상태 | `src/types/property.ts`, `src/features/properties/{queries,store,parseFilter,format}.ts` | ✅ |
| UI 컴포넌트 | `src/features/properties/components/*`, `src/components/ads/InFeedAdSlot.tsx` | ✅ |
| 페이지/API 라우트 | `src/app/properties/*`, `src/app/api/properties/*`, `src/app/api/revalidate/route.ts` | ✅ |
| n8n 워크플로우 | `n8n/workflows/onbid-collect.json` | ⏳ 필드매핑 보류 |
| 문서 | `docs/01-plan`, `docs/02-design`, `docs/03-analysis` | ✅ |

---

## 4. Incomplete Items

### 4.1 Carried Over to Next Cycle

| Item | Reason | Priority | Estimated Effort |
|------|--------|----------|------------------|
| 온비드 API 활용신청 + 실제 필드 매핑 | data.go.kr 로그인·활용신청은 에이전트가 대행 불가 | High | 사용자 작업 0.5일 + 반영 1시간 |
| `.env.local` 구성 후 Runtime(L1-L3) 테스트 | Supabase 프로젝트 미생성 | High | 0.5일 |
| 읍면동 레벨 필터 | 지역 데이터셋 부재 (YAGNI로 범위 제외) | Low | 필요시 추후 |

### 4.2 Cancelled/On Hold Items

| Item | Reason | Alternative |
|------|--------|-------------|
| 법원경매(courtauction.go.kr) 연동 | 공식 API 부재, 크롤링 필요 | 별도 feature로 분리(Plan §2.2 Out of Scope) |

---

## 5. Quality Metrics

### 5.1 Final Analysis Results

| Metric | Target | Final | Change |
|--------|--------|-------|--------|
| Design Match Rate | 90% | 98.4% | +8.4% |
| Structural Match | - | 100% | - |
| Functional Match | - | 96% | +8%p (iterate 전 88%) |
| Contract Match | - | 100% | - |
| Lint Errors | 0 | 0 | ✅ |
| Build | 성공 | 성공 | ✅ |

### 5.2 Resolved Issues

| Issue | Resolution | Result |
|-------|------------|--------|
| 소재지 필터 다중선택 미구현 | 시도/시군구 쉼표 다중입력 추가 | ✅ Resolved |
| Next.js 16 `cacheComponents`가 SSG/ISR 전제와 충돌 | `next.config.ts`에서 실험 플래그 제거 | ✅ Resolved |
| `react-hooks/set-state-in-effect` lint 오류 | `startTransition`으로 래핑 | ✅ Resolved |

---

## 6. Lessons Learned & Retrospective

### 6.1 What Went Well (Keep)

- Design 문서의 Session Guide(module-1~4)로 세션을 나눠 진행하니 각 단계 검증(typecheck/lint/build)이 명확했음
- Design 단계에서 미리 "법원경매 API 부재" 리스크를 짚어둬서 Plan 범위를 온비드로 좁힌 결정이 Do 단계까지 일관되게 유지됨

### 6.2 What Needs Improvement (Problem)

- 온비드 실제 API 스펙(필드명)을 Design 단계에서 조사하지 못해 module-4에서 placeholder로 처리할 수밖에 없었음 — 외부 API는 Plan/Design 전에 최소 스펙 확인이 필요
- `create-next-app@latest`가 예상과 다른 Next 16 canary를 설치해 Design의 버전 전제와 어긋남 — 스캐폴딩 전 버전 고정 필요

### 6.3 What to Try Next (Try)

- 외부 공공 API 연동 feature는 Plan 전에 "API 스펙 확인" 체크포인트를 추가
- `create-next-app` 호출 시 `next@14` 등 버전 명시해 스캐폴딩

---

## 7. Process Improvement Suggestions

### 7.1 PDCA Process

| Phase | Current | Improvement Suggestion |
|-------|---------|------------------------|
| Plan | 외부 API 의존성 리스크만 언급 | 외부 API 스펙 확인을 Plan 체크포인트에 추가 |
| Do | 스캐폴딩 버전 미고정 | Design에 패키지 버전 명시, Do에서 그대로 사용 |

### 7.2 Tools/Environment

| Area | Improvement Suggestion | Expected Benefit |
|------|------------------------|------------------|
| 환경변수 | `.env.local` 생성을 가드레일 예외로 허용하거나, 사용자 안내 자동화 | 온보딩 마찰 감소 |
| 테스트 | Supabase 로컬(CLI) 연결 후 L1 curl 테스트 자동 실행 | Match Rate에 Runtime 반영 가능 |

---

## 8. Next Steps

### 8.1 Immediate

- [ ] 사용자: data.go.kr 온비드 API 활용신청 → `ONBID_API_KEY` 발급
- [ ] 사용자: Supabase 프로젝트 생성 → `.env.local` 구성 (가이드: Design §8.3)
- [ ] `n8n/workflows/onbid-collect.json`의 TODO 필드 실제 값으로 교체 후 n8n import

### 8.2 Next PDCA Cycle

| Item | Priority | Expected Start |
|------|----------|----------------|
| F2 임장 정보 (`/pdca pm viewing-guide` 또는 `/pdca plan viewing-guide`) | High | property-listing 데이터 연동 확인 후 |
| F4 즐겨찾기 & 알림 | Medium | F2 이후 |

---

## 9. Changelog

### v0.1.0 (2026-10-28)

**Added:**
- 매물 리스트/필터/카드/상세 페이지 (`/properties`, `/properties/[id]`)
- `/api/properties`, `/api/properties/:id`, `/api/revalidate`
- Supabase `properties` 테이블 + 인덱스 + RLS
- n8n 온비드 수집 워크플로우(필드매핑 TODO)

**Changed:**
- `next.config.ts`에서 `cacheComponents`/`partialPrefetching` 제거(Next 16 canary 호환)

**Fixed:**
- 소재지 필터 다중선택 미구현 (Gap Analysis 이후 보강)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-10-28 | Completion report created | 장대광 |
