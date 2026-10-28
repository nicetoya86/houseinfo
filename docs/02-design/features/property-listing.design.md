---
template: design
version: 1.3
feature: property-listing
date: 2026-10-28
author: 장대광
project: houseinfo
---

# property-listing Design Document

> **Summary**: 온비드 공매 매물을 수집해 다중 필터 리스트/상세 페이지로 제공하는 설계
>
> **Project**: houseinfo
> **Version**: 0.1.0
> **Author**: 장대광
> **Date**: 2026-10-28
> **Status**: Draft
> **Planning Doc**: [property-listing.plan.md](../../01-plan/features/property-listing.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 경매·공매 매물 탐색이 여러 사이트에 흩어져 있어 초보 투자자의 진입장벽이 높음 |
| **WHO** | 경매 입문자, 중급 투자자, 공매 관심자 (30~40대 직장인 중심) |
| **RISK** | 법원경매정보(courtauction.go.kr)는 공식 API가 없어 크롤링 필요 — 구조 변경에 취약 |
| **SUCCESS** | 온비드 매물 200건 이상 자동 수집·표시, 필터 응답 1초 이내, 일 1회 자동 갱신 |
| **SCOPE** | 1차: 온비드 공매만 연동. 법원경매(크롤링)는 2차 작업으로 분리 |

---

## 1. Overview

### 1.1 Design Goals

- 온비드 API → n8n → Supabase upsert 파이프라인을 신뢰성 있게 구축
- 다중 필터 조합 쿼리를 1초 이내 응답하도록 인덱스 설계
- 리스트/상세를 SSG+ISR로 사전 생성해 SEO 대응
- F2(임장)·F3(권리분석)이 이어 붙을 수 있도록 `properties` 도메인을 독립 모듈로 분리

### 1.2 Design Principles

- Single Responsibility: 수집(n8n) / 저장(Supabase) / 서빙(Next.js) 역할 분리
- 확장 대비: `properties` 모듈 인터페이스는 F2/F3가 재사용 가능하게 설계
- YAGNI: 인증·즐겨찾기·법원경매 크롤링은 이번 범위에서 제외

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 페이지 내 직접 Supabase 호출 | domain/application/infra 완전분리 | features/properties 모듈 + 얇은 서비스 레이어 |
| **New Files** | 6 | 16 | 10 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low (결합↑, 후속확장시 재작업) | Low (초기 과설계) | Low (균형) |
| **Recommendation** | 빠른 검증 | 장기 대형 프로젝트 | **기본 선택** |

**Selected**: Option C — **Rationale**: 신규 프로젝트라 Enterprise급 레이어 분리는 과설계. 단, F2/F3가 곧 이어지므로 `properties` 서비스 레이어와 타입은 모듈로 독립시켜 재사용성 확보.

### 2.1 Component Diagram

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│  온비드 API   │────▶│  n8n (Cron 1일1회)  │────▶│  Supabase    │
└──────────────┘     │  수집·diff·upsert   │     │  (Postgres)  │
                      └─────────┬──────────┘     └──────┬───────┘
                                │ webhook                │
                                ▼                        ▼
                      ┌───────────────────┐     ┌──────────────┐
                      │ Next.js revalidate │◀────│ properties   │
                      │ (ISR)              │     │ service      │
                      └─────────┬──────────┘     └──────────────┘
                                ▼
                      ┌───────────────────┐
                      │  Client (Browser)  │
                      │  리스트/필터/상세   │
                      └───────────────────┘
```

### 2.2 Data Flow

```
온비드 API 수집(n8n) → properties upsert(Supabase) → ISR revalidate webhook
  → 사용자 필터 입력 → properties 서비스 쿼리(Supabase) → 리스트/카드 렌더 → 상세 이동
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| 필터 UI (PropertyFilterPanel) | properties service | 필터 조건으로 쿼리 실행 |
| 리스트 (PropertyList) | properties service, InFeedAdSlot | 매물 카드 렌더 + 5번째마다 광고 |
| 상세 페이지 | properties service | 단일 매물 조회 |
| n8n 워크플로우 | 온비드 API, Supabase service role | 수집·upsert |
| ISR revalidate route | Supabase webhook | 매물 페이지 재생성 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/types/property.ts
interface Property {
  id: string;                 // UUID
  caseNumber: string;         // 사건번호(온비드: 공고번호+물건번호)
  type: 'auction' | 'public_sale'; // 경매/공매 구분 (1차는 public_sale만)
  category: PropertyCategory; // 아파트/다세대/오피스텔/상가/토지/공장 등
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  address: string;
  appraisalValue: number;     // 감정가
  minBid: number;             // 최저매각가
  failCount: number;          // 유찰횟수
  saleDate: string;           // 매각기일 (ISO date)
  zoneType: string | null;    // 용도지역
  status: 'active' | 'sold' | 'cancelled';
  images: string[];
  createdAt: string;
  updatedAt: string;
}

type PropertyCategory = 'apartment' | 'villa' | 'officetel' | 'commercial' | 'land' | 'factory' | 'etc';
```

### 3.2 Entity Relationships

```
[Property] (1차: F1 단독, F2/F3에서 아래 테이블이 FK로 연결 예정)
   └── (F2) ──── 1 ──── 1 [ViewingGuide]   (이번 범위 제외)
   └── (F3) ──── 1 ──── 1 [AnalysisReport] (이번 범위 제외)
```

### 3.3 Database Schema

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('auction', 'public_sale')),
  category TEXT NOT NULL,
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  eupmyeondong TEXT,
  address TEXT NOT NULL,
  appraisal_value BIGINT NOT NULL,
  min_bid BIGINT NOT NULL,
  fail_count SMALLINT NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL,
  zone_type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 필터 성능을 위한 인덱스
CREATE INDEX idx_properties_filter ON properties (status, sido, sigungu, category, sale_date);
CREATE INDEX idx_properties_appraisal ON properties (appraisal_value);
CREATE INDEX idx_properties_min_bid ON properties (min_bid);
CREATE INDEX idx_properties_fail_count ON properties (fail_count);
```

---

## 4. API Specification

Next.js Server Component에서 Supabase client로 직접 쿼리 (별도 REST API 레이어 불필요, Dynamic 레벨 BaaS 패턴). 클라이언트 필터 상호작용은 Route Handler 1개로 처리.

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/properties | 필터 조건으로 매물 목록 조회 (쿼리스트링) | 불필요 |
| GET | /api/properties/:id | 매물 상세 조회 | 불필요 |
| POST | /api/revalidate | n8n → ISR revalidate 웹훅 | Secret 헤더 |

### 4.2 Detailed Specification

#### `GET /api/properties?sido=서울&category=apartment&maxAppraisal=500000000&minFailCount=1`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "caseNumber": "2026-12345",
      "address": "서울 강남구 ...",
      "appraisalValue": 450000000,
      "minBid": 360000000,
      "failCount": 1,
      "saleDate": "2026-12-01",
      "images": []
    }
  ],
  "pagination": { "total": 120, "page": 1, "pageSize": 20 }
}
```

**Error Responses:**
- `400 Bad Request`: 필터 파라미터 타입 오류

#### `POST /api/revalidate`

**Request:**
```json
{ "propertyId": "uuid" }
```

**Error Responses:**
- `401 Unauthorized`: `ISR_REVALIDATE_SECRET` 불일치

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌────────────────────────────────────┐
│  Header (로고, 경매/공매 전체 탭)      │
├───────────┬────────────────────────┤
│  필터패널  │  매물 카드 리스트          │
│ (바텀시트  │  [카드][카드][카드][카드]   │
│  모바일)   │  [카드][인피드광고][카드]   │
│           │  무한스크롤                │
└───────────┴────────────────────────┘
```

### 5.2 User Flow

```
리스트 진입 → 필터 적용 → 카드 클릭 → 상세 페이지(기본정보 탭)
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| PropertyFilterPanel | src/features/properties/components/ | 필터 폼, Zustand store 연동 |
| PropertyList | src/features/properties/components/ | 카드 렌더 + 무한스크롤 + 인피드 광고 삽입 |
| PropertyCard | src/features/properties/components/ | 단일 매물 카드 |
| InFeedAdSlot | src/components/ads/ | 인피드 광고 자리 (AdSense ins 태그 placeholder) |
| PropertyDetail | src/features/properties/components/ | 상세 기본정보 표시 |

### 5.4 Page UI Checklist

#### 매물 리스트 페이지 (`/properties`)

- [ ] Filter: 소재지 시도/시군구/읍면동 다중선택 드롭다운
- [ ] Filter: 물건종류 드롭다운 (아파트/다세대/오피스텔/상가/토지/공장/기타)
- [ ] Filter: 감정가 범위 슬라이더 (min/max 직접입력 가능)
- [ ] Filter: 최저가 범위 슬라이더
- [ ] Filter: 유찰횟수 선택 (0회~5회 이상)
- [ ] Filter: 매각기일 범위 날짜선택
- [ ] Filter: 용도지역 드롭다운 (주거/상업/공업/녹지)
- [ ] Card: 사건번호, 소재지, 감정가(₩), 최저가(₩), 유찰횟수(N회), 매각기일(YYYY-MM-DD)
- [ ] Card: 물건 사진 (없으면 플레이스홀더)
- [ ] InFeed: 5번째 카드마다 광고 슬롯 1개
- [ ] Infinite scroll: 스크롤 하단 도달 시 다음 페이지 로드

#### 매물 상세 페이지 (`/properties/[id]`)

- [ ] 기본정보 탭: 사건번호/소재지/물건종류/감정가/최저가/유찰횟수/매각기일/용도지역 전체 표시
- [ ] 탭 네비게이션: 기본정보 / 임장정보(F2, 비활성 placeholder) / 권리분석(F3, 비활성 placeholder) / 지도(F2, 비활성)

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid filter params | 잘못된 쿼리 타입 | 클라이언트에서 기본값으로 재요청 |
| 404 | Property not found | 존재하지 않는 id | 404 페이지 표시 |
| 401 | Unauthorized | revalidate secret 불일치 | n8n 워크플로우 알림 |
| 500 | Internal error | Supabase 연결 실패 | 에러 로깅, 사용자에 재시도 안내 |

### 6.2 Error Response Format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid filter parameter", "details": {} } }
```

---

## 7. Security Considerations

- [ ] 필터 입력 파라미터 타입/범위 검증 (SQL Injection은 Supabase client parameterized query로 방지)
- [ ] `/api/revalidate`는 `ISR_REVALIDATE_SECRET` 헤더 검증 필수
- [ ] Supabase anon key는 RLS로 `properties` 테이블 SELECT만 허용, INSERT/UPDATE는 service role(n8n)만

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | /api/properties, /api/properties/:id | curl | Do |
| L2: UI Action Tests | 필터 적용, 카드 클릭 | Playwright | Do |
| L3: E2E Scenario Tests | 필터→리스트→상세 플로우 | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Test Description | Expected Status | Expected Response |
|---|----------|--------|-----------------|:--------------:|-------------------|
| 1 | /api/properties | GET | 기본 목록 조회 | 200 | `.data` 배열, `.pagination.total` > 0 |
| 2 | /api/properties/:id | GET | 상세 조회 | 200 | `.data.id` 존재 |
| 3 | /api/properties?sido=서울 | GET | 필터 적용 | 200 | 필터된 결과 수 < 전체 수 |
| 4 | /api/properties/:badid | GET | 존재하지 않는 id | 404 | `.error.code` = "NOT_FOUND" |
| 5 | /api/revalidate | POST | secret 불일치 | 401 | `.error.code` = "UNAUTHORIZED" |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result | Data Verification |
|---|------|--------|----------------|-------------------|
| 1 | 리스트 | 페이지 로드 | §5.4 체크리스트 요소 전부 노출 | DB 데이터 렌더 (스켈레톤 아님) |
| 2 | 리스트 | 감정가 필터 적용 | 카드 수 감소 | count 감소 확인 |
| 3 | 리스트 | 카드 클릭 | 상세 페이지 이동 | URL에 id 포함 |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 매물 탐색 | 리스트 진입 → 필터(소재지+유찰횟수) → 카드클릭 → 상세(사건번호+감정가 표시) | 전 과정 DB 데이터 기반 렌더 |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| properties | 20 | sido, category, appraisalValue, failCount, saleDate 다양하게 분포 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 필터 패널, 카드, 리스트, 상세 UI | `src/features/properties/components/` |
| **Application** | 필터 상태관리, 쿼리 조합 | `src/features/properties/hooks/`, `src/features/properties/store.ts` |
| **Domain** | Property 타입, 카테고리 enum | `src/types/property.ts` |
| **Infrastructure** | Supabase client, API route handler | `src/lib/supabase.ts`, `src/app/api/properties/` |

### 9.2 Dependency Rules

```
Presentation → Application → Domain ← Infrastructure
Domain은 외부 의존성 없음 (순수 타입)
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| Presentation | Application, Domain | Infrastructure 직접 |
| Application | Domain, Infrastructure | Presentation |
| Domain | 없음 | 전부 |
| Infrastructure | Domain | Application, Presentation |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| PropertyFilterPanel, PropertyList, PropertyCard, PropertyDetail | Presentation | `src/features/properties/components/` |
| usePropertyFilter, propertyStore (Zustand) | Application | `src/features/properties/` |
| Property, PropertyCategory | Domain | `src/types/property.ts` |
| supabase client, GET /api/properties | Infrastructure | `src/lib/supabase.ts`, `src/app/api/properties/route.ts` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `PropertyCard.tsx` |
| Functions | camelCase | `getProperties()` |
| Types | PascalCase | `Property`, `PropertyFilter` |
| Files (component) | PascalCase.tsx | `PropertyFilterPanel.tsx` |
| Files (utility) | camelCase.ts | `buildPropertyQuery.ts` |
| Folders | kebab-case | `properties/` |

### 10.2 Import Order

표준 순서(외부 라이브러리 → 내부 절대경로 → 상대경로 → 타입 → 스타일) 적용.

### 10.3 Environment Variables

| Prefix | Purpose | Scope |
|--------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_*` | Supabase 클라이언트 연결 | Browser |
| `SUPABASE_SERVICE_ROLE_KEY` | n8n upsert용 | Server/n8n |
| `ISR_REVALIDATE_SECRET` | revalidate 웹훅 인증 | Server |

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| State management | Zustand 단일 store로 필터 상태 관리 |
| Error handling | API route는 공통 에러 응답 포맷 사용 |
| File organization | `src/features/properties/` 모듈 단위 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── properties/
│   │   ├── page.tsx              # 리스트 페이지
│   │   └── [id]/page.tsx         # 상세 페이지
│   └── api/
│       ├── properties/route.ts
│       ├── properties/[id]/route.ts
│       └── revalidate/route.ts
├── features/properties/
│   ├── components/
│   │   ├── PropertyFilterPanel.tsx
│   │   ├── PropertyList.tsx
│   │   ├── PropertyCard.tsx
│   │   └── PropertyDetail.tsx
│   ├── store.ts                   # Zustand 필터 상태
│   └── queries.ts                 # Supabase 쿼리 빌더
├── components/ads/InFeedAdSlot.tsx
├── types/property.ts
└── lib/supabase.ts
n8n/workflows/onbid-collect.json   # export (n8n 콘솔에서 구성)
supabase/migrations/0001_properties.sql
```

### 11.2 Implementation Order

1. [ ] Supabase 프로젝트 생성 + `properties` 테이블 마이그레이션
2. [ ] `src/types/property.ts`, `src/lib/supabase.ts` 작성
3. [ ] `src/features/properties/queries.ts` (필터 쿼리 빌더) + API route 구현
4. [ ] 리스트 페이지 + 필터 패널 + 카드 + 인피드 광고 슬롯
5. [ ] 상세 페이지 (기본정보 탭)
6. [ ] n8n 온비드 수집 워크플로우 + revalidate 웹훅 연동
7. [ ] 시드 데이터 작성 + L1/L2/L3 테스트

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| DB & 타입 기반 | `module-1` | Supabase 스키마, types, supabase client | 15-20 |
| 필터/API | `module-2` | 쿼리 빌더, API route, 필터 상태관리 | 25-30 |
| UI (리스트/카드/상세) | `module-3` | 리스트/카드/상세 페이지 + 인피드 광고 | 30-35 |
| n8n 파이프라인 | `module-4` | 온비드 수집 워크플로우, revalidate 웹훅 | 20-25 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1,module-2` | 40-50 |
| Session 3 | Do | `--scope module-3` | 30-35 |
| Session 4 | Do | `--scope module-4` | 20-25 |
| Session 5 | Check + Report | 전체 | 30-40 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft (Option C 선택) | 장대광 |
