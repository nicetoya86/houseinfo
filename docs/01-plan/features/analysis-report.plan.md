---
template: plan
version: 1.3
feature: analysis-report
date: 2026-10-28
author: 장대광
project: houseinfo
version_tag: 0.1.0
---

# analysis-report Planning Document

> **Summary**: 매물 상세의 "권리분석" 탭 — 등기부등본 업로드(OCR)로 선순위권리·임차인현황을 추출하고, 결정적 알고리즘으로 배당순위를 시뮬레이션해 AI 설명과 함께 제공
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
| **Problem** | 경매 낙찰 후 인수해야 할 권리(선순위 근저당·임차인 대항력 등)를 직접 분석하기 어렵고, 등기부등본 자동 수집도 불가능함 |
| **Solution** | 사용자가 등기부등본을 업로드하면 Gemini Vision으로 권리정보를 추출하고, 배당순위는 결정적 알고리즘(코드)으로 계산, Gemini는 설명문만 생성해 신뢰성 확보 |
| **Function/UX Effect** | 매물 상세의 "권리분석" 탭 활성화 → 업로드→분석 결과(말소기준권리/임차인분석/배당표/인수부담/예상낙찰가)를 한 화면에서 확인, 리포트 생성 시 전면광고 |
| **Core Value** | 복잡한 법적 분석을 자동화해 입찰 의사결정 시간을 단축하고, 핵심 분석 콘텐츠 진입점으로 수익화 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 권리분석은 경매의 핵심 리스크 판단 요소인데 수작업 분석이 어렵고 등기부등본 자동 수집도 불가능 |
| **WHO** | 중급 투자자(교차검증 필요), 경매 입문자(권리분석 자체를 어려워함) |
| **RISK** | OCR 추출 오류 시 법적 책임 문제 → 면책고지 필수 + 배당계산은 AI가 아닌 결정적 코드로 처리해 신뢰성 확보 |
| **SUCCESS** | 업로드→분석 결과 생성 성공률 90%+, 배당표 숫자는 100% 코드 계산(AI 변동 없음), 동일 매물 재요청시 캐시 응답 |
| **SCOPE** | 1차: PDF/이미지 업로드+OCR+결정적 배당계산+Gemini 설명. 실시간 등기부등본 자동조회는 범위 밖(기술적으로 불가) |

---

## 1. Overview

### 1.1 Purpose

매물 상세 페이지에 "권리분석" 탭을 활성화해, 사용자가 등기부등본을 업로드하면 말소기준권리·임차인 대항력·배당순위·인수부담·예상낙찰가를 자동 분석해 제공한다.

### 1.2 Background

PRD F3: 등기부등본은 인터넷등기소 캡차로 자동 수집 불가 → 사용자 직접 업로드가 유일한 현실적 입력 경로. 배당순위는 민법/배당 순위 규칙이 결정적이므로 AI 생성에 맡기면 숫자 오류 리스크가 커서, 코드 알고리즘으로 계산하고 Gemini는 자연어 설명만 담당하도록 역할을 분리한다.

### 1.3 Related Documents

- Requirements: `부동산 경매·공매 임장 정보 서비스 PRD.md` (F3 섹션)
- 선행 feature: property-listing, viewing-guide (동일 상세 페이지 탭 구조 재사용)

---

## 2. Scope

### 2.1 In Scope

- [ ] 등기부등본 PDF/이미지 업로드 UI (Supabase Storage 저장)
- [ ] Gemini Vision OCR로 선순위 권리 목록 추출(권리종류/설정일/채권액/순위)
- [ ] 말소기준권리 판단 로직 (최선순위 저당권/가압류/담보가등기 등 기준)
- [ ] 임차인 대항력·우선변제권 판단 보조 (전입일/확정일자 vs 말소기준권리일 비교)
- [ ] 배당순위 시뮬레이션: 예상 낙찰가 입력 → 결정적 알고리즘으로 채권자별 배당액 계산
- [ ] 인수 부담 요약: 말소기준권리보다 선순위인 권리 목록
- [ ] 예상 낙찰가 범위: 유사 물건 낙찰 통계 기반 상/중/하 (1차는 property-listing의 실거래가 데이터 활용한 간이 추정)
- [ ] `analysis_reports` 테이블 캐싱 (동일 매물 재요청시 캐시 반환)
- [ ] 권리분석 버튼 클릭 시 로딩 중 전면광고 구조(route 전환)
- [ ] 모든 결과에 AI 면책 고지 필수 표시

### 2.2 Out of Scope

- 인터넷등기소 자동 조회/크롤링 (캡차로 기술적 불가)
- 등기부등본 실시간 발급 연동
- OCR 결과의 법적 정확성 보증 (면책고지로 대체)
- 유사 물건 낙찰 통계의 정교한 통계 모델 (1차는 property-listing 실거래가 기반 단순 추정)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 사용자가 매물 상세의 "권리분석" 탭에서 등기부등본 PDF/이미지 업로드 | High | Pending |
| FR-02 | Gemini Vision API로 업로드 파일에서 권리 목록(종류/설정일/채권액/순위) 추출 | High | Pending |
| FR-03 | 추출된 권리 목록 기준 말소기준권리 자동 판단 (코드 로직) | High | Pending |
| FR-04 | 임차인 전입일/확정일자 입력 시 대항력·우선변제권 여부 판단 보조 | Medium | Pending |
| FR-05 | 예상 낙찰가 입력 시 결정적 알고리즘으로 채권자별 배당액 계산·표시 | High | Pending |
| FR-06 | 인수 부담 목록(말소기준권리보다 선순위인 권리) 표시 | High | Pending |
| FR-07 | 예상 낙찰가 범위(상/중/하) 표시 (property-listing 실거래가 기반 추정) | Medium | Pending |
| FR-08 | 분석 결과 `analysis_reports`에 캐싱, 동일 매물 재요청시 캐시 반환 | Medium | Pending |
| FR-09 | 모든 분석 결과에 AI 면책 고지 문구 표시 | High | Pending |
| FR-10 | 권리분석 버튼 클릭 시 route 전환(Vignette 전면광고 자연 트리거 구조) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 법적 안전 | 모든 응답에 면책 고지 포함 | 코드 리뷰로 누락 여부 확인 |
| 계산 신뢰성 | 배당액 계산은 100% 결정적 코드(AI 비개입) | 코드 리뷰 |
| 캐싱 | 동일 매물 재요청시 Gemini/OCR 재호출 없음 | `analysis_reports` 존재 여부로 분기 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 등기부등본 샘플 1건 업로드 → OCR 추출 → 말소기준권리 판단 → 배당표 생성까지 1회 이상 성공
- [ ] 배당액 합계가 입력된 예상낙찰가를 초과하지 않음(알고리즘 검증)
- [ ] 모든 응답에 면책 고지 포함
- [ ] Code review completed

### 4.2 Quality Criteria

- [ ] 배당 알고리즘 단위 테스트 통과(최소 3개 시나리오: 선순위 전액배당/안분배당/임차인 포함)
- [ ] Zero lint errors
- [ ] Build succeeds

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OCR 추출 오류(필기체/스캔품질) → 잘못된 권리정보 | High | Medium | 업로드 후 사용자가 추출 결과를 직접 수정할 수 있는 폼 제공(Design 단계에서 상세화) |
| 배당 계산 로직이 실제 법적 배당 규칙과 다를 수 있음 | High | Medium | 면책고지 필수 + "참고용" 명시, 복잡한 특수 케이스(물상대위 등)는 범위 제외 명시 |
| Gemini Vision OCR 비용/속도 | Medium | Low | 캐싱으로 재호출 최소화 |
| 등기부등본 개인정보(소유자명 등) 포함 — 저장 시 노출 리스크 | High | Medium | Supabase Storage 비공개 버킷 + RLS로 업로드한 사용자만 접근(Design에서 상세화) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| analysis_reports | DB Table (신규) | 권리분석 결과 캐싱 테이블 |
| Supabase Storage 버킷 | Storage (신규) | 등기부등본 파일 비공개 저장 |
| 매물 상세 페이지 | Next.js Route (수정) | 비활성 "권리분석" 탭 → 활성 탭 + 서브라우트 `/properties/[id]/analysis` 추가 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| properties 테이블 | READ | `analysis_reports`가 FK로 참조만 함 | None |
| PropertyDetail.tsx | UPDATE | 비활성 "권리분석" span을 활성 링크로 교체 | Needs verification |

### 6.3 Verification

- [ ] 기존 기본정보/임장정보 탭 동작에 영향 없음 확인
- [ ] properties, viewing_guides 테이블 스키마 변경 없음 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| **Dynamic** | ☑ (기존 feature와 동일) |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| OCR | Gemini Vision / 전용 OCR 서비스 | Gemini Vision | 이미 Gemini 키 보유, 추가 서비스 불필요 |
| 배당 계산 | AI 생성 / 결정적 알고리즘 | 결정적 알고리즘 | 숫자 정확성·재현성 확보, AI는 설명문 생성에만 사용 |
| 파일 저장 | Supabase Storage / 외부 스토리지 | Supabase Storage | 기존 Supabase 프로젝트 재사용, 비공개 버킷+RLS |
| 캐싱 | 매 요청 재분석 / DB 캐싱 | DB 캐싱(`analysis_reports`) | F2(viewing-guide)와 동일 패턴, 비용 절감 |

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] property-listing/viewing-guide에서 확립된 features/* 모듈 구조, PascalCase 컴포넌트 재사용

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| 파일 업로드 패턴 | 없음(신규) | Supabase Storage 업로드 유틸 | High |
| 결정적 계산 로직 위치 | 없음(신규) | `src/features/analysis-report/lib/distribution.ts` 순수 함수로 분리, 단위 테스트 가능하게 | High |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `GEMINI_API_KEY` | Gemini Vision OCR (viewing-guide와 공유 가능) | Server | ☐ (기존 재사용 가능) |
| `SUPABASE_STORAGE_BUCKET` | 등기부등본 비공개 버킷명 | Server | ☐ |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`analysis-report.design.md`) — OCR 추출 폼, 배당 알고리즘 상세 설계 포함
2. [ ] 팀 리뷰
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-10-28 | Initial draft | 장대광 |
