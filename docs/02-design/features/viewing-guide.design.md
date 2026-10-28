---
template: design
version: 1.3
feature: viewing-guide
date: 2026-10-28
author: 장대광
project: houseinfo
---

# viewing-guide Design Document

> **Summary**: 매물 상세의 "임장정보" 탭 — AI 생성 인프라 요약/체크리스트 + 카카오맵 + 국토부 실거래가
>
> **Project**: houseinfo
> **Version**: 0.1.0
> **Author**: 장대광
> **Date**: 2026-10-28
> **Status**: Draft
> **Planning Doc**: [viewing-guide.plan.md](../../01-plan/features/viewing-guide.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 임장 전 동네 인프라·시세·체크리스트를 알아야 하는데 여러 곳을 따로 찾아봐야 함 |
| **WHO** | property-listing 상세 페이지까지 도달한 경매 입문자/중급 투자자 |
| **RISK** | KB시세는 공식 API 없어 범위 제외, 카카오맵 일일 호출한도, Gemini 생성 품질 편차 |
| **SUCCESS** | 신규 매물 등록 후 임장 가이드 자동 생성 성공률 90%+, 탭 최초 진입 시 전면광고 1회 노출 |
| **SCOPE** | 1차: 카카오맵+국토부 실거래가+Gemini 생성(캐싱). KB시세·로드뷰 상세 연동은 2차 |

---

## 1. Overview

### 1.1 Design Goals

- property-listing(F1)의 비활성 "임장정보" 탭을 실제 라우트로 전환
- n8n(파이프라인 B)이 신규 매물 등록 시 비동기로 콘텐츠를 생성해 `viewing_guides`에 캐싱 → Next.js는 캐시 읽기만 수행(실시간 Gemini 호출 없음)
- 외부 API(카카오/국토부) 호출은 n8n 쪽에서 1회만 수행해 Next.js 런타임은 외부 API 키 노출·호출 부담 없음

### 1.2 Design Principles

- 읽기 전용 서빙: Next.js는 `viewing_guides` 캐시만 읽음 (F1의 BaaS 직접쿼리 패턴 재사용)
- 생성은 n8n 비동기 책임: 캐시 미스 시 "생성 중" 상태를 보여주고 폴링하지 않음(Phase 1은 생성 완료 후에만 노출)
- F1과 동일 컨벤션 유지(features/ 모듈, PascalCase, Zustand 불필요 — 전역 상태 없음)

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 상세페이지 안에서 직접 Supabase 쿼리 | repository/usecase 완전분리 | features/viewing-guide 모듈 + 얇은 쿼리 레이어 |
| **New Files** | 4 | 13 | 7 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low | Low(과설계) | Low |
| **Recommendation** | 빠른 검증 | 장기 대형 프로젝트 | **기본 선택** |

**Selected**: Option C — **Rationale**: F1(property-listing)과 동일한 패턴(features/* 모듈, 얇은 쿼리 레이어)을 유지해 일관성 확보, 과설계 회피.

### 2.1 Component Diagram

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│ 신규 매물 이벤트│────▶│ n8n 파이프라인 B    │────▶│  Supabase    │
│ (A 파이프라인후)│     │ Kakao+MOLIT+Gemini │     │viewing_guides│
└──────────────┘     └────────────────────┘     └──────┬───────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │ /properties/[id]/   │
                                              │ viewing (Server     │
                                              │ Component, 캐시만 read)│
                                              └──────────┬──────────┘
                                                         ▼
                                              ┌─────────────────────┐
                                              │ Client: 카카오맵 SDK │
                                              │ 임베드(JS Key)       │
                                              └─────────────────────┘
```

### 2.2 Data Flow

```
[n8n] 신규 매물 이벤트 → 카카오 장소검색(반경1km) + MOLIT 실거래가 조회
  → Gemini 프롬프트(소재지+물건종류+감정가+인프라+시세) → 체크리스트/요약 생성
  → viewing_guides upsert (품질검증: 체크리스트 5항목 미만 시 재생성 플래그)

[Next.js] 사용자가 "임장정보" 탭 클릭 → /properties/[id]/viewing 라우트 전환
  → viewing_guides 캐시 조회 → 없으면 "생성 준비중" 안내, 있으면 4요소 렌더
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| ViewingGuideContent | viewing-guide queries | 인프라 요약/체크리스트/시세 렌더 |
| KakaoMapEmbed | `NEXT_PUBLIC_KAKAO_JS_KEY` | 매물 좌표 중심 지도 표시 |
| n8n 파이프라인 B | 카카오 REST API, MOLIT API, Gemini API | 콘텐츠 생성·캐싱 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/types/viewing-guide.ts
interface ViewingGuide {
  id: string;
  propertyId: string;
  infrastructureSummary: string;        // Gemini 생성 텍스트 요약
  checklist: string[];                  // 임장 체크리스트 항목
  nearbyPrices: NearbyPriceItem[];      // 국토부 실거래가 기반
  nearbyFacilities: NearbyFacility[];   // 카카오 장소검색 결과
  coordinates: { lat: number; lng: number } | null;
  generatedBy: 'gemini-flash';
  qualityFlag: 'ok' | 'needs_regeneration';
  createdAt: string;
}

interface NearbyPriceItem {
  complexName: string;
  dealDate: string;
  price: number;
  area: number;
}

interface NearbyFacility {
  category: '지하철' | '버스' | '마트' | '병원' | '학교';
  name: string;
  distanceMeters: number;
}
```

### 3.2 Entity Relationships

```
[Property] 1 ──── 1 [ViewingGuide]  (property_id UNIQUE FK)
```

### 3.3 Database Schema

```sql
CREATE TABLE viewing_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  infrastructure_summary TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]',
  nearby_prices JSONB NOT NULL DEFAULT '[]',
  nearby_facilities JSONB NOT NULL DEFAULT '[]',
  coordinates JSONB,
  generated_by TEXT NOT NULL DEFAULT 'gemini-flash',
  quality_flag TEXT NOT NULL DEFAULT 'ok' CHECK (quality_flag IN ('ok', 'needs_regeneration')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_viewing_guides_property ON viewing_guides (property_id);

ALTER TABLE viewing_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viewing_guides_public_read"
  ON viewing_guides FOR SELECT
  USING (true);
```

---

## 4. API Specification

Next.js는 Server Component에서 Supabase client로 캐시 직접 조회 (F1과 동일 BaaS 패턴). 별도 쓰기 API는 없음 — n8n이 Supabase service role로 직접 upsert.

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| (없음) | `/properties/:id/viewing` | Server Component가 `fetchViewingGuide(propertyId)`로 직접 조회 | 불필요 |

### 4.2 Detailed Specification

별도 REST 엔드포인트 없음 — `src/features/viewing-guide/queries.ts`의 `fetchViewingGuideByPropertyId(propertyId)`가 Supabase를 직접 쿼리하고, 결과 없으면 `null` 반환 → 페이지에서 "생성 준비중" 상태 렌더.

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
/properties/[id]/viewing
┌────────────────────────────────────┐
│  탭: 기본정보 | [임장정보] | 권리분석(비활성) | 지도(통합됨) │
├────────────────────────────────────┤
│  동네 인프라 요약 (텍스트)            │
│  임장 체크리스트 (체크박스 목록)       │
│  주변 실거래가 (테이블)               │
│  카카오맵 임베드 (좌표 마커)           │
│  ⚠️ AI 생성 참고자료 면책 고지         │
└────────────────────────────────────┘
```

### 5.2 User Flow

```
매물 상세 → "임장정보" 탭 클릭(route 전환) → 캐시 조회
  → 있으면: 인프라요약/체크리스트/시세/지도 렌더
  → 없으면: "임장 가이드 생성 준비중입니다" 안내
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| ViewingGuideContent | src/features/viewing-guide/components/ | 요약/체크리스트/시세 렌더 |
| KakaoMapEmbed | src/features/viewing-guide/components/ | 카카오맵 SDK 임베드 |
| ViewingGuideEmptyState | src/features/viewing-guide/components/ | 캐시 없을 때 안내 |

### 5.4 Page UI Checklist

#### 임장정보 페이지 (`/properties/[id]/viewing`)

- [ ] 탭 네비게이션: 기본정보(링크) / 임장정보(현재 활성) / 권리분석(비활성, F3) 표시
- [ ] 인프라 요약 텍스트 블록
- [ ] 임장 체크리스트: 항목별 체크박스(클라이언트 로컬 상태, 서버 저장 안함 — 1차 범위)
- [ ] 주변 실거래가 테이블: 단지명/거래일/가격/면적 컬럼
- [ ] 카카오맵: 매물 좌표 중심 마커 1개
- [ ] AI 면책 고지 문구 ("본 분석은 AI가 생성한 참고 자료이며...")
- [ ] 캐시 없을 때: "임장 가이드 생성 준비중입니다" 안내 문구

#### 매물 상세 페이지 탭 수정 (`/properties/[id]`)

- [ ] "임장정보" 탭: 기존 비활성 span → `/properties/[id]/viewing` 링크로 교체

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 404 | Property not found | 존재하지 않는 propertyId | 상위 매물 상세와 동일하게 404 페이지 |
| (캐시 미스) | - | `viewing_guides` 레코드 없음 | 에러 아님 — "생성 준비중" 안내 (ViewingGuideEmptyState) |

### 6.2 Error Response Format

해당 없음 (전용 API 없음, Server Component 내부 처리)

---

## 7. Security Considerations

- [ ] `viewing_guides`도 RLS로 anon SELECT만 허용, n8n(service role)만 쓰기 가능 — properties와 동일 정책
- [ ] 카카오 JS 키는 `NEXT_PUBLIC_*`로 클라이언트 노출(카카오맵 SDK 특성상 불가피, 도메인 화이트리스트로 제한)
- [ ] 카카오 REST API 키, MOLIT API 키, Gemini API 키는 n8n 환경변수로만 보관(Next.js에 노출 안 함)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | 해당 없음(전용 API 없음) — Supabase 쿼리 함수 단위 확인으로 대체 | 수동/curl(Supabase REST) | Do |
| L2: UI Action Tests | 임장정보 탭 클릭, 체크리스트 체크 | Playwright | Do |
| L3: E2E Scenario Tests | 상세→임장정보 탭 이동→데이터 렌더 확인 | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | 대상 | Test Description | Expected |
|---|------|-------------------|----------|
| 1 | `fetchViewingGuideByPropertyId` | 캐시 존재 시 데이터 반환 | 객체 반환, 4개 필드 모두 존재 |
| 2 | `fetchViewingGuideByPropertyId` | 캐시 없을 때 | `null` 반환 (에러 아님) |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | 매물 상세 | "임장정보" 탭 클릭 | `/properties/:id/viewing`로 이동 |
| 2 | 임장정보 페이지 | 체크리스트 항목 클릭 | 체크 상태 토글(로컬) |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 임장정보 확인 | 리스트→상세→임장정보 탭→4요소 확인 | 캐시 존재 매물 기준 전부 렌더 |
| 2 | 캐시 미스 처리 | 가이드 미생성 매물 접근 | "생성 준비중" 안내 노출, 에러 없음 |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| viewing_guides | 2 (1건은 캐시 있음, 1건은 의도적으로 없음) | infrastructure_summary, checklist 최소 5항목 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | ViewingGuideContent, KakaoMapEmbed, EmptyState | `src/features/viewing-guide/components/` |
| **Application** | 없음(전역 상태 불필요) | - |
| **Domain** | ViewingGuide 타입 | `src/types/viewing-guide.ts` |
| **Infrastructure** | Supabase 쿼리 | `src/features/viewing-guide/queries.ts` |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| ViewingGuideContent, KakaoMapEmbed, ViewingGuideEmptyState | Presentation | `src/features/viewing-guide/components/` |
| fetchViewingGuideByPropertyId | Infrastructure | `src/features/viewing-guide/queries.ts` |
| ViewingGuide, NearbyPriceItem, NearbyFacility | Domain | `src/types/viewing-guide.ts` |

---

## 10. Coding Convention Reference

property-listing(F1)과 동일 컨벤션 적용 (PascalCase 컴포넌트, camelCase 유틸, kebab-case 폴더).

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/properties/[id]/
│   └── viewing/page.tsx
├── features/viewing-guide/
│   ├── components/
│   │   ├── ViewingGuideContent.tsx
│   │   ├── KakaoMapEmbed.tsx
│   │   └── ViewingGuideEmptyState.tsx
│   └── queries.ts
├── types/viewing-guide.ts
supabase/migrations/0002_viewing_guides.sql
n8n/workflows/viewing-guide-generate.json
```

### 11.2 Implementation Order

1. [ ] `viewing_guides` 마이그레이션 + 타입 정의
2. [ ] `queries.ts` (fetchViewingGuideByPropertyId)
3. [ ] UI 컴포넌트(ViewingGuideContent/KakaoMapEmbed/EmptyState) + 페이지
4. [ ] 매물 상세 탭 링크 수정 (PropertyDetail.tsx)
5. [ ] n8n 파이프라인 B (카카오+MOLIT+Gemini → upsert)

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| DB & 타입 | `module-1` | 마이그레이션, types/viewing-guide.ts, queries.ts | 15-20 |
| UI | `module-2` | 임장정보 페이지 + 3개 컴포넌트 + 상세 탭 링크 수정 | 30-35 |
| n8n 파이프라인 B | `module-3` | 카카오/MOLIT/Gemini 연동 워크플로우(실제 Gemini 키 보유, 실연동 가능) | 25-30 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1,module-2` | 40-50 |
| Session 3 | Do | `--scope module-3` | 25-30 |
| Session 4 | Check + Report | 전체 | 30-40 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft (Option C 선택) | 장대광 |
