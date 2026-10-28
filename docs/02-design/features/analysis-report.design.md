---
template: design
version: 1.3
feature: analysis-report
date: 2026-10-28
author: 장대광
project: houseinfo
---

# analysis-report Design Document

> **Summary**: 등기부등본 업로드→OCR 추출→말소기준권리 판단→배당시뮬레이션(결정적 계산)→AI 설명 제공하는 "권리분석" 탭
>
> **Project**: houseinfo
> **Version**: 0.1.0
> **Author**: 장대광
> **Date**: 2026-10-28
> **Status**: Draft
> **Planning Doc**: [analysis-report.plan.md](../../01-plan/features/analysis-report.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 권리분석은 경매의 핵심 리스크 판단 요소인데 수작업 분석이 어렵고 등기부등본 자동 수집도 불가능 |
| **WHO** | 중급 투자자(교차검증 필요), 경매 입문자(권리분석 자체를 어려워함) |
| **RISK** | OCR 추출 오류 → 면책고지 + 사용자 수정 폼으로 완화, 배당계산은 AI 아닌 결정적 코드 |
| **SUCCESS** | 업로드→분석 성공률 90%+, 배당표는 100% 코드 계산, 동일 매물 캐시 응답 |
| **SCOPE** | 1차: PDF/이미지 업로드+OCR+결정적 배당계산+Gemini 설명. 실시간 등기부 자동조회는 범위 밖 |

---

## 1. Overview

### 1.1 Design Goals

- OCR 추출 결과를 사용자가 검증·수정할 수 있는 2단계 플로우(추출→확인/수정→확정) 설계
- 배당액 계산은 순수 함수(`distribution.ts`)로 분리해 AI 개입 없이 100% 재현 가능하게 함
- 등기부등본 원본 파일은 비공개 Storage에 저장, RLS로 접근 제한

### 1.2 Design Principles

- 신뢰성 분리: "사실 추출+계산"은 결정적 로직, "설명"만 AI(Gemini) 담당
- F1/F2와 동일 컨벤션(features/* 모듈)
- 개인정보 보호: 등기부등본은 비공개 버킷, RLS로 업로드 세션만 접근

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 페이지 내 업로드+OCR+계산 직접 구현 | repository/usecase 완전분리 | features/analysis-report 모듈 + 순수함수 분리 |
| **New Files** | 5 | 15 | 9 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium(계산로직 테스트 어려움) | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Medium(배당로직 검증 어려움) | Low(과설계) | Low |
| **Recommendation** | 빠른 검증 | 장기 대형 | **기본 선택** |

**Selected**: Option C — **Rationale**: 배당 알고리즘은 Plan §4.2 품질기준(단위테스트 3개 시나리오)을 요구하므로 순수함수로 분리가 필수. F1/F2와 동일 모듈 패턴 유지.

### 2.1 Component Diagram

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────┐
│ 사용자 업로드 │────▶│ POST /api/analysis- │────▶│ Supabase     │
│ (PDF/이미지)  │     │ reports/upload       │     │ Storage(비공개)│
└──────────────┘     │ (Gemini Vision OCR)  │     └──────┬───────┘
                      └──────────┬───────────┘            │
                                 ▼                         ▼
                      ┌────────────────────┐     ┌──────────────┐
                      │ determineBaseRight  │────▶│ analysis_    │
                      │ (순수함수)           │     │ reports      │
                      └──────────┬───────────┘     └──────┬───────┘
                                 ▼                         │
                      ┌────────────────────┐               ▼
                      │ Gemini 설명문 생성   │     ┌──────────────────┐
                      └──────────┬───────────┘     │ /properties/[id]/ │
                                 └────────────────▶│ analysis (Client) │
                                                    │ + distribution.ts │
                                                    │ (낙찰가 입력시 클라│
                                                    │ 이언트 계산)        │
                                                    └──────────────────┘
```

### 2.2 Data Flow

```
업로드 → Storage 저장 → Gemini Vision OCR(권리목록 추출)
  → determineBaseRight(순수함수, 말소기준권리 판단) → assumed burdens 계산
  → Gemini(설명문만 생성) → analysis_reports upsert(캐시)
  → 사용자가 예상낙찰가 입력 → calculateDistribution(순수함수, 클라이언트 실행) → 배당표 즉시 표시
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| RightsUploadForm | `/api/analysis-reports/upload` | 파일 업로드 트리거 |
| RightsExtractionReview | analysis-report queries | 추출결과 확인/수정 |
| DistributionSimulator | `distribution.ts` | 클라이언트에서 배당 즉시 계산 |
| AnalysisReportContent | 위 전부 | 조립 + 면책고지 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// src/types/analysis-report.ts
export type RightType = 'mortgage' | 'seizure' | 'provisional_seizure' | 'lease_right' | 'auction_registration';

export interface Right {
  type: RightType;
  label: string;          // 등기목적 (예: "근저당권설정")
  registeredAt: string;    // 설정일 (ISO date)
  amount: number;          // 채권액
  priority: number;        // 접수순위(1부터)
}

export interface TenantInfo {
  moveInDate: string | null;   // 전입일
  confirmedDate: string | null; // 확정일자
  deposit: number | null;       // 보증금
}

export interface AnalysisReport {
  id: string;
  propertyId: string;
  sourceFilePath: string;       // Storage 경로
  rights: Right[];
  baseRightIndex: number | null; // rights 배열 내 말소기준권리 인덱스
  tenantInfo: TenantInfo | null;
  assumedBurdens: Right[];       // 말소기준권리보다 선순위인 권리
  expectedBidRange: { low: number; mid: number; high: number } | null;
  explanationText: string;       // Gemini 생성 설명(계산 아님)
  qualityFlag: 'ok' | 'needs_review';
  createdAt: string;
}

export interface DistributionEntry {
  right: Right;
  claimedAmount: number;
  paidAmount: number;
  shortfall: number;
}
```

### 3.2 Entity Relationships

```
[Property] 1 ──── 1 [AnalysisReport]  (property_id UNIQUE FK)
```

### 3.3 Database Schema

```sql
CREATE TABLE analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  source_file_path TEXT NOT NULL,
  rights JSONB NOT NULL DEFAULT '[]',
  base_right_index SMALLINT,
  tenant_info JSONB,
  assumed_burdens JSONB NOT NULL DEFAULT '[]',
  expected_bid_range JSONB,
  explanation_text TEXT NOT NULL DEFAULT '',
  quality_flag TEXT NOT NULL DEFAULT 'ok' CHECK (quality_flag IN ('ok', 'needs_review')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_reports_property ON analysis_reports (property_id);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- 개인정보 포함 가능성 — properties/viewing_guides와 달리 공개 SELECT 금지, service role만 전체 접근
-- 클라이언트는 자신이 업로드한 매물의 리포트만 API route(서버)를 통해 조회
CREATE POLICY "analysis_reports_service_role_only"
  ON analysis_reports FOR ALL
  USING (false);

-- Storage: 비공개 버킷 'registry-documents', RLS로 서버(service role)만 read/write
```

---

## 4. API Specification

등기부등본은 개인정보 포함 가능성이 있어 properties/viewing_guides와 달리 **전용 API 라우트를 통해서만** 접근(클라이언트 직접 Supabase 쿼리 금지).

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/analysis-reports/upload | 등기부등본 업로드 + OCR + 캐싱 | 불필요(1차, 추후 Auth 연동시 강화) |
| GET | /api/analysis-reports/:propertyId | 캐시된 분석 결과 조회 | 불필요 |

### 4.2 Detailed Specification

#### `POST /api/analysis-reports/upload`

**Request**: `multipart/form-data` — `propertyId`, `file`(PDF/이미지)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "propertyId": "uuid",
    "rights": [{ "type": "mortgage", "label": "근저당권설정", "registeredAt": "2023-01-10", "amount": 300000000, "priority": 1 }],
    "baseRightIndex": 0,
    "assumedBurdens": [],
    "explanationText": "..."
  }
}
```

**Error Responses:**
- `400 Bad Request`: 파일 누락/형식 오류
- `422 Unprocessable Entity`: OCR 추출 실패(필기체/저품질 스캔) → `quality_flag: needs_review`로 저장 후 빈 rights 반환, 사용자 수동 입력 유도

#### `GET /api/analysis-reports/:propertyId`

**Response (200 OK)**: 캐시 존재 시 `AnalysisReport`, 없으면 `{ "data": null }`

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
/properties/[id]/analysis
┌────────────────────────────────────┐
│  탭: 기본정보 | 임장정보 | [권리분석]   │
├────────────────────────────────────┤
│  (캐시 없음) 등기부등본 업로드 폼        │
│  (캐시 있음) 말소기준권리 표시           │
│             임차인 대항력 안내           │
│             인수부담 목록                │
│             예상낙찰가 입력 → 배당표      │
│             예상낙찰가 범위(상/중/하)     │
│  ⚠️ AI 생성 참고자료 면책 고지            │
└────────────────────────────────────┘
```

### 5.2 User Flow

```
권리분석 탭 클릭(route 전환, 전면광고 구조) → 캐시 조회
  → 없으면: 업로드 폼 → 업로드 → OCR 추출 → 결과 표시
  → 있으면: 말소기준권리/인수부담/예상낙찰가범위 표시 → 예상낙찰가 입력 → 배당표 즉시 계산
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| RightsUploadForm | src/features/analysis-report/components/ | 파일 업로드 + 로딩 상태 |
| AnalysisReportSummary | src/features/analysis-report/components/ | 말소기준권리/임차인분석/인수부담/예상낙찰가범위 |
| DistributionSimulator | src/features/analysis-report/components/ | 낙찰가 입력 폼 + 배당표(클라이언트 계산) |

### 5.4 Page UI Checklist

#### 권리분석 페이지 (`/properties/[id]/analysis`) — 캐시 없음

- [ ] 탭 네비게이션: 기본정보/임장정보(링크) / 권리분석(활성)
- [ ] 파일 업로드 input (PDF, JPG, PNG)
- [ ] 업로드 버튼 + 로딩 상태 표시
- [ ] OCR 실패 시 "직접 입력" 안내 문구

#### 권리분석 페이지 — 캐시 있음

- [ ] 말소기준권리 하이라이트 표시(종류+설정일)
- [ ] 임차인 대항력/우선변제권 안내(전입일 vs 말소기준권리일 비교 — 정보 있을 때만)
- [ ] 인수부담 목록 테이블(종류/설정일/채권액)
- [ ] 예상낙찰가 입력 필드
- [ ] 배당표: 입력 즉시 클라이언트에서 재계산(권리별 청구액/배당액/부족액)
- [ ] 예상낙찰가 범위(상/중/하) 표시
- [ ] AI 면책 고지 문구

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid upload | 파일 누락/형식 오류 | 클라이언트 재업로드 안내 |
| 422 | OCR extraction failed | 저품질 스캔/필기체 | `needs_review` 플래그, 빈 결과 반환 |
| 500 | Internal error | Gemini/Storage 오류 | 에러 로깅, 재시도 안내 |

### 6.2 Error Response Format

```json
{ "error": { "code": "OCR_EXTRACTION_FAILED", "message": "등기부등본에서 권리 정보를 추출하지 못했습니다", "details": {} } }
```

---

## 7. Security Considerations

- [ ] `analysis_reports`, Storage 버킷 모두 RLS로 service role(서버 API)만 접근 — 클라이언트 직접 쿼리 차단(개인정보 보호)
- [ ] 파일 업로드 크기/타입 제한 (PDF/JPG/PNG, 10MB 이하)
- [ ] Gemini API로 전송되는 파일에 개인정보(소유자명 등) 포함됨 — 이용약관에 고지 필요(F3 범위 밖, 법적 페이지에서 처리)
- [ ] 모든 분석 결과에 면책 고지 필수

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: Unit Tests | `distribution.ts`, `determineBaseRight.ts` 순수함수 | Node assert/vitest | Do |
| L2: UI Action Tests | 업로드, 낙찰가 입력 | Playwright | Do |
| L3: E2E Scenario Tests | 업로드→분석→배당시뮬레이션 전체 플로우 | Playwright | Do |

### 8.2 L1: Unit Test Scenarios (배당 알고리즘 — Plan §4.2 품질기준)

| # | 시나리오 | 입력 | 기대 결과 |
|---|---------|------|----------|
| 1 | 선순위 전액배당 | 1순위 3억, 낙찰가 5억 | 1순위 3억 전액 배당, 잔여 2억은 2순위로 |
| 2 | 안분배당(동순위) | 동순위 2건 각 2억(합 4억), 낙찰가 2억 | 각 1억씩 안분(50%) |
| 3 | 배당 부족 | 1순위 5억, 낙찰가 3억 | 1순위 3억만 배당, shortfall 2억 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | 권리분석(캐시없음) | 파일 업로드 | 로딩 후 분석 결과 표시 |
| 2 | 권리분석(캐시있음) | 예상낙찰가 입력 | 배당표 즉시 갱신 |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 권리분석 전체 플로우 | 상세→권리분석탭→업로드→결과확인→낙찰가입력→배당표 | 전 과정 에러 없이 완료, 면책고지 노출 |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| analysis_reports | 1 (테스트용 샘플 등기부 OCR 결과) | rights 최소 2건(선순위/후순위) |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 업로드폼/요약/시뮬레이터 | `src/features/analysis-report/components/` |
| **Application** | 배당계산, 말소기준권리 판단(순수함수) | `src/features/analysis-report/lib/` |
| **Domain** | AnalysisReport, Right 타입 | `src/types/analysis-report.ts` |
| **Infrastructure** | API route, Storage, Gemini 호출 | `src/app/api/analysis-reports/`, `src/lib/gemini.ts` |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| RightsUploadForm, AnalysisReportSummary, DistributionSimulator | Presentation | `src/features/analysis-report/components/` |
| calculateDistribution, determineBaseRight | Application(순수함수) | `src/features/analysis-report/lib/distribution.ts`, `baseRight.ts` |
| AnalysisReport, Right, TenantInfo | Domain | `src/types/analysis-report.ts` |
| upload route, Gemini client | Infrastructure | `src/app/api/analysis-reports/upload/route.ts`, `src/lib/gemini.ts` |

---

## 10. Coding Convention Reference

F1/F2와 동일 컨벤션 적용.

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── properties/[id]/analysis/page.tsx
│   └── api/analysis-reports/
│       ├── upload/route.ts
│       └── [propertyId]/route.ts
├── features/analysis-report/
│   ├── components/
│   │   ├── RightsUploadForm.tsx
│   │   ├── AnalysisReportSummary.tsx
│   │   └── DistributionSimulator.tsx
│   ├── lib/
│   │   ├── distribution.ts       # 순수함수 + 단위테스트
│   │   └── baseRight.ts          # 순수함수 + 단위테스트
│   └── queries.ts
├── lib/gemini.ts                  # Gemini Vision 클라이언트(viewing-guide와 역할 다름: 서버용)
├── types/analysis-report.ts
supabase/migrations/0003_analysis_reports.sql
```

### 11.2 Implementation Order

1. [ ] `analysis_reports` 마이그레이션 + Storage 버킷 설정 + 타입 정의
2. [ ] `distribution.ts`, `baseRight.ts` 순수함수 + 단위테스트(L1)
3. [ ] 업로드 API route(Gemini Vision 연동) + 조회 API route
4. [ ] UI 컴포넌트(업로드폼/요약/시뮬레이터) + 페이지 + 상세 탭 링크 수정

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| DB & 타입 & 순수함수 | `module-1` | 마이그레이션, types, distribution.ts, baseRight.ts + 단위테스트 | 25-30 |
| API & OCR 연동 | `module-2` | 업로드/조회 API route, Gemini Vision 클라이언트 | 25-30 |
| UI | `module-3` | 업로드폼/요약/시뮬레이터 컴포넌트 + 페이지 + 상세탭 링크 | 30-35 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1` | 25-30 |
| Session 3 | Do | `--scope module-2` | 25-30 |
| Session 4 | Do | `--scope module-3` | 30-35 |
| Session 5 | Check + QA + Report | 전체 | 40-50 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft (Option C 선택) | 장대광 |
