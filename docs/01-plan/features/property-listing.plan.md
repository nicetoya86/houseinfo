---
template: plan
version: 1.3
feature: property-listing
date: 2026-10-28
author: 장대광
project: houseinfo
version_tag: 0.1.0
---

# property-listing Planning Document

> **Summary**: 법원경매·캠코공매 매물을 통합 조회·필터링하는 리스트/상세 화면과 데이터 수집 파이프라인
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
| **Problem** | 경매·공매 매물 정보가 여러 사이트에 분산되어 있어 초보 투자자가 조건별 탐색을 하기 어렵다 |
| **Solution** | 온비드 공매 API를 n8n으로 일 1회 수집해 Supabase에 적재하고, Next.js에서 다중 필터 리스트+카드+상세 페이지로 제공 |
| **Function/UX Effect** | 소재지·용도·감정가·유찰횟수 등으로 즉시 필터링, 카드 클릭 시 상세 이동, 5번째 카드마다 인피드 광고 |
| **Core Value** | 매물 탐색 단계를 한 곳에 모아 이후 임장(F2)·권리분석(F3) 기능의 진입점을 만든다 |

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

### 1.1 Purpose

경매·공매 매물을 지역·용도·감정가·유찰횟수 등 다중 조건으로 필터링해 보여주는 통합 리스트와 상세 페이지를 제공한다. 이후 F2(임장정보)·F3(권리분석) 기능이 이 매물 상세 페이지를 기반으로 확장된다.

### 1.2 Background

PRD 배경: 법원경매·캠코공매 정보는 공공데이터로 열려 있지만 여러 사이트를 오가야 하는 문제. 매물 탐색을 한 곳에 모아 AdSense 수익화의 진입점(인피드 광고)으로도 활용.

### 1.3 Related Documents

- Requirements: `부동산 경매·공매 임장 정보 서비스 PRD.md`
- References: 온비드 공공자산 공개 API (onbid.co.kr), 공공데이터포털(data.go.kr)

---

## 2. Scope

### 2.1 In Scope

- [ ] 온비드 공매 API 연동 n8n 파이프라인 (일 1회 수집 → Supabase upsert)
- [ ] `properties` 테이블 스키마 및 Supabase 설정
- [ ] 매물 리스트 페이지 (카드형, 무한 스크롤)
- [ ] 다중 필터 UI (소재지/물건종류/감정가/최저가/유찰횟수/매각기일/용도지역, 경매공매구분은 공매 고정)
- [ ] 매물 상세 페이지 (기본정보 탭만, 임장/권리분석 탭은 F2/F3에서 추가)
- [ ] 인피드 광고 슬롯 (리스트 5번째 카드마다, 콘텐츠 영역만 — 실제 AdSense 연동은 승인 후)
- [ ] Next.js SSG/ISR 매물 페이지 사전 생성 + revalidate 웹훅

### 2.2 Out of Scope

- 법원경매정보(courtauction.go.kr) 크롤링 연동 (API 부재로 2차 작업, 별도 feature로 분리)
- F2 임장 정보, F3 권리분석 (후속 feature)
- 즐겨찾기/알림 (F4, 후속 feature)
- PWA 설정, AdSense 실제 승인·심사
- 회원 인증 (Supabase Auth)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | n8n이 온비드 API에서 매물 데이터를 일 1회 수집해 `properties` 테이블에 upsert | High | Pending |
| FR-02 | 매물 리스트는 소재지(시도>시군구>읍면동 다중선택)/물건종류/감정가범위/최저가범위/유찰횟수/매각기일/용도지역으로 필터링 가능 | High | Pending |
| FR-03 | 매물 카드에 사건번호·소재지·감정가·최저가·유찰횟수·매각기일·사진(있을 경우) 표시, 클릭 시 상세 이동 | High | Pending |
| FR-04 | 매물 상세 페이지는 기본정보 탭 기준 전체 필드 표시 | High | Pending |
| FR-05 | 리스트 5번째 카드마다 인피드 광고 슬롯 렌더링 (AdSense `ins` 태그 자리) | Medium | Pending |
| FR-06 | 신규/변경 매물 수집 시 해당 매물 페이지 ISR revalidate 웹훅 호출 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 필터 적용 후 응답 1초 이내 (Supabase 인덱스 활용) | Lighthouse / 수동 측정 |
| SEO | 매물 상세 페이지 SSG로 사전 생성, 메타태그 포함 | Search Console 색인 확인 |
| Accessibility | 필터 폼 키보드 접근 가능 | 수동 점검 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 온비드 매물 200건 이상 자동 수집되어 리스트에 노출
- [ ] 전체 필터 조합 정상 동작
- [ ] 매물 카드 클릭 → 상세 페이지 정상 이동
- [ ] n8n 파이프라인 1회 이상 스케줄 실행 성공 로그 확인
- [ ] Code review completed

### 4.2 Quality Criteria

- [ ] 주요 쿼리(필터) 인덱스 적용
- [ ] Zero lint errors
- [ ] Build succeeds (Vercel)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 법원경매정보 API 부재로 공매만 우선 연동 → 매물 수 부족 | Medium | High | 온비드 단독으로 MVP 검증 후 법원경매 크롤링은 별도 feature로 2차 진행 |
| 온비드 API 스펙·인증 방식 확인 전 설계 | Medium | Medium | Design 단계에서 온비드 API 문서 조사 선행 |
| n8n self-hosted 장애 시 데이터 미갱신 | Low | Medium | n8n 에러 알림 설정, 실패 시 재시도 |
| 과도한 인피드 광고 밀도로 AdSense 정책 위반 | High | Low | 5번째 카드마다 1개로 제한, 콘텐츠 대비 광고 비율 30% 이하 유지 |

---

## 6. Impact Analysis

> 신규 프로젝트 (houseinfo) — 기존 리소스 없음, 전부 신규 생성

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| properties | DB Table (신규) | 매물 데이터 테이블 신규 생성 |
| n8n 수집 워크플로우 | Automation (신규) | 온비드 API → Supabase upsert |
| 매물 리스트/상세 페이지 | Next.js Route (신규) | 신규 생성 |

### 6.2 Current Consumers

- 해당 없음 (신규 프로젝트, 기존 소비자 없음)

### 6.3 Verification

- [ ] N/A (신규 생성이므로 기존 동작 영향 없음)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, DI | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | Next.js 14+ (App Router) | PRD 지정, SSG/ISR로 매물 페이지 사전 생성 |
| State Management | Context / Zustand / Redux | Zustand | 필터 상태를 여러 컴포넌트(필터 패널+리스트)가 공유, 가벼운 전역 스토어 필요 |
| API Client | fetch / axios / react-query | fetch + Supabase JS client | 추가 의존성 최소화 |
| Form Handling | react-hook-form / native | native (controlled input) | 필터 폼은 단순 입력 위주, 라이브러리 불필요 |
| Styling | Tailwind / CSS Modules | Tailwind | PRD 모바일 바텀시트 등 빠른 반응형 구현에 적합 |
| Backend | BaaS (Supabase) / Custom | Supabase (PostgreSQL) | PRD 지정, Free Tier로 시작 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic

src/
  components/       # 매물 카드, 필터 패널, 인피드 광고 슬롯
  features/
    properties/      # 리스트/상세/필터 로직
  services/
    supabase.ts      # Supabase client
  types/
    property.ts
  app/
    properties/
      page.tsx        # 리스트
      [id]/page.tsx    # 상세
n8n/
  workflows/
    onbid-collect.json  # 온비드 수집 파이프라인 export
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] `CLAUDE.md` 코딩 컨벤션 섹션 — 없음
- [ ] `docs/01-plan/conventions.md` — 없음 (Phase 2 미진행)
- [ ] ESLint/Prettier/tsconfig — 없음 (프로젝트 미생성)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 파일: kebab-case, 컴포넌트: PascalCase | High |
| **Folder structure** | missing | Dynamic 레벨 구조 (features 기반) | High |
| **Environment variables** | missing | Supabase URL/Key, 온비드 API Key | High |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Client | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | n8n → Supabase upsert용 | Server/n8n | ☐ |
| `ONBID_API_KEY` | 온비드 공공데이터 API 인증키 | n8n | ☐ |
| `ISR_REVALIDATE_SECRET` | ISR revalidate 웹훅 인증 | Server | ☐ |

### 8.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ☐ | `docs/01-plan/schema.md` | `/pipeline-next` |
| Phase 2 (Convention) | ☐ | `docs/01-plan/conventions.md` | `/pipeline-next` |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`property-listing.design.md`) — Supabase 스키마 상세화, 온비드 API 스펙 조사 포함
2. [ ] 팀 리뷰
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft | 장대광 |
