---
template: plan
version: 1.3
feature: viewing-guide
date: 2026-10-28
author: 장대광
project: houseinfo
version_tag: 0.1.0
---

# viewing-guide Planning Document

> **Summary**: 매물 상세 페이지의 "임장정보" 탭 — AI가 생성한 동네 인프라 요약, 임장 체크리스트, 주변 실거래가, 지도/로드뷰를 제공
>
> **Project**: houseinfo
> **Version**: 0.1.0
> **Author**: 장대광
> **Date**: 2026-10-28
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 매물 상세정보만으로는 실제 현장 상태·주변 인프라·시세를 알 수 없어 임장(현장답사) 전 사전 조사에 시간이 많이 듦 |
| **Solution** | Gemini API로 임장 체크리스트+인프라 요약을 자동 생성해 캐싱, 카카오맵 장소검색으로 반경 1km 인프라 조회, 국토부 실거래가로 주변 시세 표시 |
| **Function/UX Effect** | 매물 상세의 "임장정보" 탭(현재 F1에서 비활성 placeholder) 활성화 → 인프라 요약/체크리스트/시세/지도를 한 화면에서 확인 |
| **Core Value** | 현장 방문 전 핵심 판단 정보를 미리 제공해 탐색→임장 전환율을 높이고, 탭 최초 진입 시 전면광고로 수익화 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 임장 전 동네 인프라·시세·체크리스트를 알아야 하는데 여러 곳을 따로 찾아봐야 함 |
| **WHO** | property-listing 상세 페이지까지 도달한 경매 입문자/중급 투자자 |
| **RISK** | KB시세는 공식 API 없어 범위 제외, 카카오맵 일일 호출한도, Gemini 생성 품질 편차 |
| **SUCCESS** | 신규 매물 등록 후 임장 가이드 자동 생성 성공률 90%+, 탭 최초 진입 시 전면광고 1회 노출 |
| **SCOPE** | 1차: 카카오맵+국토부 실거래가+Gemini 생성(캐싱). KB시세·로드뷰 스트리트뷰 상세 연동은 2차 |

---

## 1. Overview

### 1.1 Purpose

매물 상세 페이지에 "임장정보" 탭을 활성화해, AI가 생성한 동네 인프라 요약과 임장 체크리스트, 주변 실거래가, 카카오맵 임베드를 제공한다.

### 1.2 Background

PRD F2: 매물 상세 탭 중 "임장정보"는 property-listing(F1)에서 비활성 placeholder로 남겨둔 상태. 이번 사이클에서 활성화하고, 신규 매물 등록 시 n8n→Gemini로 콘텐츠를 자동 생성해 Supabase `viewing_guides` 테이블에 캐싱한다.

### 1.3 Related Documents

- Requirements: `부동산 경매·공매 임장 정보 서비스 PRD.md` (F2 섹션)
- 선행 feature: `docs/01-plan/features/property-listing.plan.md`, `docs/02-design/features/property-listing.design.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] Supabase `viewing_guides` 테이블 (property_id FK, infrastructure_summary, checklist_json, nearby_prices, generated_by, created_at)
- [ ] 카카오맵 장소검색 API로 반경 1km 지하철/버스/마트/병원/학교 조회
- [ ] 국토교통부 실거래가 API로 동일/인근 단지 최근 실거래가 조회
- [ ] Gemini API 프롬프트: 소재지+물건종류+감정가+인프라 데이터 → 임장 체크리스트 + 인프라 요약 생성
- [ ] n8n 파이프라인 B: 신규 매물 등록 이벤트 → Gemini 호출 → `viewing_guides` 저장 (품질 불량 시 재생성 플래그)
- [ ] 매물 상세 페이지 "임장정보" 탭 활성화 (인프라 요약, 체크리스트, 주변 시세, 카카오맵 임베드)
- [ ] 탭 최초 클릭 시 route 전환(AdSense Vignette 자연 트리거 구조)

### 2.2 Out of Scope

- KB시세 연동 (공식 API 없음, 비공식 크롤링은 이번 범위 제외)
- 로드뷰(거리뷰) 상세 파노라마 — 1차는 정적 지도 임베드만
- "권리분석"(F3), "지도" 단독 탭(F2의 지도는 임장정보 탭 내부에 포함)
- 즐겨찾기/알림(F4)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | n8n: 신규 매물 등록 이벤트 트리거 → Gemini API로 임장 체크리스트+인프라 요약 생성 → `viewing_guides` upsert | High | Pending |
| FR-02 | 카카오맵 장소검색 API로 매물 좌표 반경 1km 내 지하철역/버스정류장/대형마트/병원/학교 목록 조회 | High | Pending |
| FR-03 | 국토교통부 실거래가 API로 동일 단지(또는 인근) 최근 실거래가 조회 | Medium | Pending |
| FR-04 | 매물 상세 "임장정보" 탭: 인프라 요약, 체크리스트, 주변 시세, 카카오맵 임베드 표시 | High | Pending |
| FR-05 | 임장정보 탭 최초 클릭 시 `/properties/:id/viewing`로 route 전환 (Vignette 자연 트리거 구조) | Medium | Pending |
| FR-06 | AI 생성 결과에 면책 고지 문구 표시 ("본 분석은 AI가 생성한 참고 자료...") | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 캐싱 | 동일 매물 재조회 시 Gemini 재호출 없이 캐시 반환 | `viewing_guides` 존재 여부로 분기 |
| 외부 API 호출 한도 | 카카오맵 일일 한도 내 운영 | 카카오 개발자 콘솔 모니터링 |
| 품질 | AI 생성 체크리스트 최소 5개 항목 이상 | Gemini 응답 파싱 검증 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 신규 매물 1건 기준 n8n 파이프라인이 Gemini 호출→`viewing_guides` 저장까지 1회 이상 성공
- [ ] 임장정보 탭에서 인프라 요약/체크리스트/시세/지도 4요소 모두 렌더
- [ ] 면책 고지 문구 모든 응답에 표시
- [ ] Code review completed

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] 캐시 히트 시 Gemini 재호출 발생하지 않음(로그로 확인)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| KB시세 미연동으로 시세 정보 빈약 | Medium | High | 국토부 실거래가만으로 1차 제공, 추후 보강 |
| Gemini 생성 품질 편차(체크리스트 부실 등) | Medium | Medium | 응답 파싱 후 최소 항목 수 검증, 미달 시 재생성 플래그 |
| 카카오맵 API 일일 호출 한도 초과 | Medium | Low | 결과 캐싱(viewing_guides)으로 반복 호출 최소화 |
| Vignette 광고는 Google Auto Ads 제어라 코드로 직접 트리거 불가 | Low | High(구조적 한계) | route 전환 구조만 구현, 실제 광고 노출은 AdSense 승인 후 자동 적용 (Plan 범위에서 "구현 완료"로 간주하지 않고 전제조건으로 문서화) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| viewing_guides | DB Table (신규) | 임장 가이드 데이터 신규 테이블 |
| 매물 상세 페이지 | Next.js Route (수정) | `/properties/[id]` 비활성 탭 → 활성 탭 + 서브라우트 `/properties/[id]/viewing` 추가 |
| n8n 수집 파이프라인 | Automation (추가) | 파이프라인 B 신규 추가 (파이프라인 A와 독립) |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| properties 테이블 | READ | `viewing_guides`가 FK로 참조만 함 | None — 기존 스키마 변경 없음 |
| PropertyDetail.tsx | UPDATE | 비활성 탭("임장정보")을 활성 링크로 교체 | Needs verification — 기존 placeholder 탭 UI 변경 |

### 6.3 Verification

- [ ] 기존 property-listing 상세 페이지의 "기본정보" 탭 동작에 영향 없음 확인
- [ ] properties 테이블 스키마 변경 없음 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| **Dynamic** | ☑ (property-listing과 동일 레벨 유지) |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 지도 API | 카카오맵 / 브이월드 | 카카오맵 | 장소검색 API로 반경 조회 가능, PRD 1순위 |
| 시세 데이터 | 국토부 실거래가 / KB시세 포함 | 국토부 실거래가만 | KB시세 공식 API 부재, 리스크 회피 |
| AI 생성 | Gemini API (Flash) | Gemini API | PRD 지정, 키 보유 확인됨 |
| 캐싱 전략 | 매 요청 재생성 / DB 캐싱 | DB 캐싱(`viewing_guides`) | 비용·응답속도 절감, Design §Data Model에서 상세화 |

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] property-listing에서 확립된 컨벤션 재사용 (features/ 모듈 구조, PascalCase 컴포넌트 등)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| 외부 API 클라이언트 위치 | `src/lib/supabase.ts` 선례 존재 | `src/lib/kakao.ts`, `src/lib/gemini.ts` 패턴 동일 적용 | High |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `KAKAO_REST_API_KEY` | 카카오맵 장소검색 REST API | Server | ☐ |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오맵 JS SDK(지도 임베드) | Client | ☐ |
| `MOLIT_RTMS_API_KEY` | 국토부 실거래가 공공데이터 API | Server/n8n | ☐ |
| `GEMINI_API_KEY` | Gemini API (n8n에서 사용) | n8n | ☐ |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`viewing-guide.design.md`)
2. [ ] 팀 리뷰
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft | 장대광 |
