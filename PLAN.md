# 식당 직원 스케줄러 — 개발 계획서 (PLAN)

> **기반 문서:** PRD v1.1 · FSD v1.0 · USER_FLOW.md  
> **작성일:** 2026-03-26  
> **총 예상 기간:** 5~6주 (Phase 1~3)

---

## 핵심 전제 (PRD 대비 변경 사항)

| 항목 | PRD 원안 | **실제 적용** |
|------|----------|--------------|
| 사용자 | 관리자 + 직원 | **점장 1명만 사용** |
| 고정 휴무 신청 | 직원이 직접 신청 → 관리자 승인 | **점장이 구두 확인 후 직접 입력** |
| 인증 | 관리자 로그인 + 직원 PIN | **인증 없음 — 바로 앱 진입** |
| 데이터 저장 | Supabase (PostgreSQL) | **브라우저 LocalStorage** |
| 백엔드 | Next.js API Routes | **없음 — 100% 클라이언트 SPA** |
| 직원 수 | 최대 20명 기준 | **10명 이하** |
| 파트타임 | 포함 가능 | **없음 — 전원 정규직** |
| 4주 시작 요일 | 자유 선택 | **항상 월요일 고정** |
| 최소 출근 인원 | 별도 설정 | **휴무 배정에 따라 자동 결정** |
| 배포 | Vercel / AWS | **Vercel (정적 호스팅)** |

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [데이터 모델 (LocalStorage)](#3-데이터-모델-localstorage)
4. [Phase 1 — MVP (2~3주)](#4-phase-1--mvp-23주)
5. [Phase 2 — 완성도 (1.5~2주)](#5-phase-2--완성도-152주)
6. [Phase 3 — 확장 (1~1.5주)](#6-phase-3--확장-115주)
7. [주차별 스프린트 계획](#7-주차별-스프린트-계획)
8. [화면 구성 (IA)](#8-화면-구성-ia)
9. [알고리즘 엔진 설계](#9-알고리즘-엔진-설계)
10. [테스트 전략](#10-테스트-전략)
11. [배포](#11-배포)

---

## 1. 기술 스택

| 영역 | 기술 | 선정 이유 |
|------|------|-----------|
| **빌드 도구** | Vite | 빠른 HMR, 가벼움, 백엔드 불필요한 SPA에 최적 |
| **프레임워크** | React 19 + TypeScript | 컴포넌트 기반 UI, 타입 안정성 |
| **스타일링** | TailwindCSS + shadcn/ui | 빠른 UI 개발, 일관된 디자인 |
| **상태 관리** | Zustand + persist 미들웨어 | LocalStorage 자동 동기화 내장 |
| **라우팅** | React Router v7 | SPA 내 페이지 전환 |
| **날짜 처리** | date-fns | 경량, 트리쉐이킹, 4주 계산 |
| **엑셀 출력** | SheetJS (xlsx) | 클라이언트 사이드 xlsx 생성 |
| **PDF 출력** | jsPDF + html2canvas | A4 가로 인쇄 최적화 |
| **테스트** | Vitest | Vite 네이티브 테스트 러너 |
| **배포** | Vercel | 정적 SPA 호스팅, 자동 배포 |

---

## 2. 프로젝트 구조

```
scheduler/
├── src/
│   ├── main.tsx                  # 앱 진입점
│   ├── App.tsx                   # 라우터 설정
│   │
│   ├── pages/                    # 페이지 컴포넌트
│   │   ├── DashboardPage.tsx     # 홈 대시보드
│   │   ├── EmployeesPage.tsx     # 직원 관리
│   │   ├── PeriodSetupPage.tsx   # 4주 기간 설정 + 매장 휴무일
│   │   ├── FixedLeaveePage.tsx   # 고정 휴무 입력 (점장이 직접)
│   │   ├── SchedulePage.tsx      # 스케줄 생성 + 캘린더 뷰 + 수동 수정
│   │   ├── FairnessPage.tsx      # 금토일 균등 현황판
│   │   └── HistoryPage.tsx       # 이력 조회
│   │
│   ├── components/               # 공유 컴포넌트
│   │   ├── ui/                   # shadcn/ui 기본 컴포넌트
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # 전체 레이아웃 (사이드바 + 메인)
│   │   │   ├── Sidebar.tsx       # 네비게이션 사이드바
│   │   │   └── MobileNav.tsx     # 모바일 하단 탭
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.tsx       # 직원×28일 그리드
│   │   │   ├── CalendarCell.tsx       # 개별 셀 (색상, 클릭)
│   │   │   ├── CalendarHeader.tsx     # 날짜 헤더 (요일, 주차, 강조)
│   │   │   ├── WeekSummaryPanel.tsx   # 주차 요약 패널
│   │   │   └── DaySummaryRow.tsx      # 하단 출근 인원 요약
│   │   ├── schedule/
│   │   │   ├── FairnessDashboard.tsx  # 금토일 균등 현황판
│   │   │   ├── ValidationBanner.tsx   # 검증 결과 배너
│   │   │   └── ScheduleToolbar.tsx    # 생성/재생성/확정 버튼 바
│   │   └── employee/
│   │       ├── EmployeeForm.tsx       # 등록/수정 폼
│   │       └── EmployeeList.tsx       # 직원 목록 테이블
│   │
│   ├── engine/                   # 스케줄 알고리즘 (순수 로직)
│   │   ├── index.ts              # 엔진 진입점 — 7단계 파이프라인
│   │   ├── types.ts              # 알고리즘 입출력 타입
│   │   ├── step1-fixed-leave.ts
│   │   ├── step2-manager-block.ts
│   │   ├── step3-remaining-calc.ts
│   │   ├── step4-weekend-distribute.ts
│   │   ├── step5-consecutive-check.ts
│   │   ├── step6-weekday-random.ts
│   │   ├── step7-validate.ts
│   │   └── helpers.ts
│   │
│   ├── stores/                   # Zustand 스토어 (LocalStorage persist)
│   │   ├── employee-store.ts     # 직원 데이터
│   │   ├── schedule-store.ts     # 스케줄 + 셀 데이터
│   │   └── period-store.ts       # 기간 설정 + 매장 휴무일
│   │
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useScheduleEngine.ts  # 알고리즘 실행 훅
│   │   ├── useValidation.ts      # 실시간 제약 검증
│   │   └── useExport.ts          # 엑셀/PDF 내보내기
│   │
│   ├── lib/                      # 유틸리티
│   │   ├── date-utils.ts         # 4주 계산, 월요일 시작, 주차 분류
│   │   ├── constants.ts          # 셀 상태, 색상 코드, 직급 enum
│   │   └── storage.ts            # LocalStorage 헬퍼 (백업/복원)
│   │
│   └── types/                    # 전역 타입
│       └── index.ts              # Employee, Schedule, Cell 등
│
├── tests/
│   └── engine/                   # 알고리즘 유닛 테스트
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. 데이터 모델 (LocalStorage)

백엔드/DB 없이 Zustand persist 미들웨어로 LocalStorage에 자동 저장됩니다.

### 3.1 타입 정의

```typescript
// types/index.ts

// ─── 직급 ───
type Role = 'MANAGER' | 'ASSISTANT_MANAGER' | 'STAFF'

// ─── 셀 상태 ───
type CellStatus =
  | 'WORK'          // 정상 출근
  | 'OFF_RANDOM'    // 랜덤 배정 휴무
  | 'OFF_FIXED'     // 고정 휴무 (점장이 입력)
  | 'OFF_STORE'     // 매장 지정 휴무일 휴무
  | 'WORK_LOCKED'   // 점장/부점장 매장 휴무일 출근 (수정 불가)

// ─── 직원 ───
interface Employee {
  id: string                // crypto.randomUUID()
  name: string              // 한글 최대 20자
  role: Role
  isActive: boolean
  createdAt: string         // ISO 날짜
}

// ─── 4주 기간 설정 ───
interface PeriodConfig {
  id: string
  startDate: string         // ISO 날짜 (항상 월요일)
  endDate: string           // startDate + 27일 (일요일)
  storeClosedDates: string[] // 매장 지정 휴무일 날짜 배열
}

// ─── 고정 휴무 ───
interface FixedLeave {
  employeeId: string
  date: string              // ISO 날짜
}

// ─── 스케줄 셀 ───
interface ScheduleCell {
  employeeId: string
  date: string
  status: CellStatus
  isLocked: boolean
}

// ─── 스케줄 (4주 단위) ───
interface Schedule {
  id: string
  periodId: string
  cells: ScheduleCell[]
  fairnessScore: number     // 균등도 점수 (최대-최소)
  weekendCounts: Record<string, WeekendCount>  // 직원별 금토일 카운트
  status: 'DRAFT' | 'CONFIRMED'
  createdAt: string
  confirmedAt?: string
}

// ─── 금토일 카운트 ───
interface WeekendCount {
  fri: number
  sat: number
  sun: number
  total: number
}
```

### 3.2 LocalStorage 키 구조

```
localStorage 키                    값
──────────────────────────────────────────────
scheduler-employees               Employee[]
scheduler-periods                  PeriodConfig[]
scheduler-fixed-leaves             FixedLeave[]    (periodId별 그룹)
scheduler-schedules                Schedule[]
scheduler-current-period-id        string          (현재 작업 중인 기간 ID)
```

> Zustand persist 미들웨어가 자동으로 직렬화/역직렬화합니다.  
> 데이터 백업: JSON 파일로 내보내기/가져오기 기능 제공 (Phase 2).

---

## 4. Phase 1 — MVP (2~3주)

> **목표:** 직원 등록 → 기간 설정 → 스케줄 자동 생성 → 캘린더 뷰 확인  
> **포함 기능:** F-01, F-02, F-04, F-05, F-06, F-09

### Sprint 0: 프로젝트 초기 설정 (2일)

| ID | 태스크 | 예상 |
|----|--------|------|
| S0-1 | Vite + React + TypeScript 프로젝트 생성 | 0.5h |
| S0-2 | TailwindCSS + shadcn/ui 설치 및 설정 | 1h |
| S0-3 | React Router 설정 (페이지 라우팅) | 0.5h |
| S0-4 | Zustand 스토어 뼈대 + persist 미들웨어 | 1h |
| S0-5 | AppShell 레이아웃 (사이드바 + 헤더 + 메인 영역) | 3h |
| S0-6 | 타입 정의 (`types/index.ts`, `lib/constants.ts`) | 1h |
| S0-7 | Vercel 배포 연결 (GitHub → 자동 배포) | 0.5h |

### Sprint 1: 직원 관리 F-01 (3일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P1-01 | Zustand employee-store 구현 (CRUD + persist) | 2h |
| P1-02 | 직원 목록 UI: 테이블, 직급순 정렬, 활성/비활성 필터 | 3h |
| P1-03 | 직원 등록 폼: 이름(필수), 직급(필수) 드롭다운, 이름 중복 경고 | 2h |
| P1-04 | 직원 수정 모달: 인라인 수정, 직급 변경 | 2h |
| P1-05 | 직원 비활성화: 확인 팝업, 회색 표시, 스케줄 대상 제외 | 1h |

### Sprint 2: 4주 기간 설정 F-02 (3일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P1-06 | `date-utils.ts` 구현: 월요일 시작 강제, +27일 계산, 주차 분류, 요일 판별 | 3h |
| P1-07 | Zustand period-store 구현 (기간 CRUD + persist) | 1h |
| P1-08 | 기간 선택 UI: Date Picker (월요일만 선택 가능), 종료일 자동 표시 | 2h |
| P1-09 | 28일 미니 캘린더: 매장 지정 휴무일 토글 (클릭 → 파란 배지 ON/OFF) | 3h |
| P1-10 | 주차 요약 패널: 각 주차별 유형(주3회/일반), 지정 날짜 수 실시간 표시 | 2h |
| P1-11 | 기간 저장 + 중복 기간 경고 | 1h |

### Sprint 3: 스케줄 알고리즘 엔진 F-04/05/06 (5일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P1-12 | `engine/types.ts`: 입출력 타입 정의 | 1h |
| P1-13 | STEP 1: 고정 휴무 우선 배정 — 점장이 입력한 고정 휴무 배정 + 주별 잔여 차감 | 2h |
| P1-14 | STEP 2: 점장/부점장 매장 휴무일 제외 — WORK_LOCKED 고정, 충돌 감지 | 2h |
| P1-15 | STEP 3: 주차별 잔여 산정 — 주3회/주2회 분류, 고정 휴무 차감, 잔여 확정 | 2h |
| P1-16 | STEP 4: 금토일 균등 배분 — 합계 누적 최소 우선, 동점 처리 | 4h |
| P1-17 | STEP 5: 연속 출근 제약 — 6일 초과 탐지 + swap 로직 | 3h |
| P1-18 | STEP 6: 평일 잔여 랜덤 배분 — 월~목 균등 확률 배정 | 2h |
| P1-19 | STEP 7: 결과 검증 — 총 휴무 일치, 균등도, 연속 출근 확인, 재시도 (최대 5회) | 3h |
| P1-20 | 엔진 통합 (`engine/index.ts`): 7단계 파이프라인 실행 | 2h |
| P1-21 | 알고리즘 유닛 테스트: 정상/경계/에러 케이스 | 4h |

### Sprint 4: 4주 캘린더 뷰 F-09 (3일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P1-22 | `CalendarGrid.tsx`: 직원(행) × 28일(열) 그리드, 직급순 정렬 | 4h |
| P1-23 | `CalendarCell.tsx`: 셀 상태별 색상 코딩 (5가지 상태) | 2h |
| P1-24 | `CalendarHeader.tsx`: 요일 + 주차 배지, 금/토/일 배경 강조, 매장 휴무일 배지 | 2h |
| P1-25 | `DaySummaryRow.tsx`: 날짜별 출근/전체 인원 표시 | 1h |
| P1-26 | `ValidationBanner.tsx`: 균등도 점수, 경고 수, 통과/경고 배지 | 2h |
| P1-27 | 스케줄 생성 버튼 → 알고리즘 실행 → 캘린더 뷰 표시 연결 | 2h |
| P1-28 | 모바일 반응형: 1주차씩 스와이프, 터치 스크롤 | 3h |

---

## 5. Phase 2 — 완성도 (1.5~2주)

> **목표:** 고정 휴무 입력, 수동 수정, 재생성, 균등 현황판, 내보내기  
> **포함 기능:** F-03(점장 입력), F-07, F-08, F-10, F-11

### Sprint 5: 고정 휴무 입력 F-03 (2일)

> 원래 직원 신청 → 관리자 승인 플로우를 **점장 직접 입력**으로 단순화

| ID | 태스크 | 예상 |
|----|--------|------|
| P2-01 | 고정 휴무 입력 페이지: 직원 선택 → 캘린더에서 날짜 클릭 → 고정 휴무 등록 | 3h |
| P2-02 | 직원별 고정 휴무 목록 표시 + 삭제 가능 | 1h |
| P2-03 | 과밀 경고: 동일 날짜 고정 휴무가 많으면 경고 배지 | 1h |
| P2-04 | 점장/부점장 매장 휴무일 충돌 시 입력 차단 + 안내 메시지 | 1h |

### Sprint 6: 수동 수정 + 재생성 + 현황판 F-07/08/10 (4일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P2-05 | 셀 클릭 토글: WORK ↔ OFF 전환, 잠금 셀 클릭 시 안내 | 2h |
| P2-06 | `useValidation.ts`: 주별 총 휴무, 연속 출근, 금토일 균등도 실시간 검증 | 4h |
| P2-07 | 위반 표시: 빨간 테두리, 주황색 강조, 툴팁 | 2h |
| P2-08 | 강제 저장 + Undo (최대 20단계) | 2h |
| P2-09 | 재생성 버튼: 확인 팝업 → 고정 휴무 유지 + STEP 4~6 재랜덤화 | 2h |
| P2-10 | `FairnessDashboard.tsx`: 직원별 금/토/일 횟수, 합계, 균등도 배지, 요약 카드 | 3h |
| P2-11 | 수동 수정 시 현황판 실시간 갱신 | 1h |

### Sprint 7: 내보내기 + 데이터 백업 F-11 (2일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P2-12 | 엑셀 출력: SheetJS로 직원×28일 그리드 + 색상 + 금토일 합계 행 | 3h |
| P2-13 | PDF 출력: jsPDF + html2canvas, A4 가로 레이아웃, 미리보기 | 3h |
| P2-14 | 데이터 백업: 전체 LocalStorage → JSON 파일 다운로드 | 1h |
| P2-15 | 데이터 복원: JSON 파일 업로드 → LocalStorage 복원 | 1h |

---

## 6. Phase 3 — 확장 (1~1.5주)

> **목표:** 스케줄 확정, 이력 관리, 대시보드, 모바일 최적화  
> **포함 기능:** F-12, F-13 + 대시보드 + 최적화

### Sprint 8: 확정 + 이력 + 대시보드 (4일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P3-01 | 스케줄 확정: 확인 팝업 → CONFIRMED 상태 전환, 수정 잠금 | 2h |
| P3-02 | 확정 후 override: 관리자 모드 해제 팝업 → 수정 허용 | 1h |
| P3-03 | 이력 목록 페이지: 과거 4주 기간, 확정 일시, 균등도 점수 | 2h |
| P3-04 | 이력 상세 조회: 읽기 전용 캘린더 뷰 | 2h |
| P3-05 | 대시보드 홈: 현재 4주 요약 카드, 진행 상태, 빠른 액션 버튼 | 3h |

### Sprint 9: 모바일 + 마무리 (3일)

| ID | 태스크 | 예상 |
|----|--------|------|
| P3-06 | 모바일 레이아웃 최적화: 하단 탭 네비게이션, 사이드바 → 햄버거 | 3h |
| P3-07 | 캘린더 모바일 터치 개선: 핀치 줌, 스와이프 전환 | 2h |
| P3-08 | 인쇄 최적화: @media print CSS | 1h |
| P3-09 | PWA 설정: manifest.json, 서비스 워커 (오프라인 지원) | 2h |
| P3-10 | README.md 작성 + 최종 정리 | 1h |

---

## 7. 주차별 스프린트 계획

```
주차    스프린트         핵심 산출물                          마일스톤
──────────────────────────────────────────────────────────────────────
W1     Sprint 0+1      프로젝트 세팅 + 직원 관리             ▸ 직원 등록/조회 가능
W2     Sprint 2+3      기간 설정 + 알고리즘 엔진             ▸ 스케줄 자동 생성 가능
W3     Sprint 3+4      알고리즘 완성 + 캘린더 뷰             ▸ ★ Phase 1 MVP 완료
──────────────────────────────────────────────────────────────────────
W4     Sprint 5+6      고정 휴무 입력 + 수동 수정 + 현황판    ▸ 스케줄 편집 루프 완성
W5     Sprint 7        내보내기 + 데이터 백업                ▸ ★ Phase 2 완료
──────────────────────────────────────────────────────────────────────
W5-6   Sprint 8+9      확정/이력/대시보드 + 모바일 최적화     ▸ ★ Phase 3 완료 → 런칭
```

---

## 8. 화면 구성 (IA)

점장 1명만 사용하므로 모든 화면이 단일 권한입니다.

```
[앱 진입] (인증 없음)
  │
  ▼
[대시보드] ─────────────────── 현재 4주 요약, 빠른 액션
  │
  ├→ [직원 관리] ──────────── 등록/수정/비활성화
  │
  ├→ [4주 기간 설정] ──────── 시작일(월요일) 선택 + 매장 휴무일 지정
  │
  ├→ [고정 휴무 입력] ──────── 직원 선택 → 날짜 지정 (점장이 직접)
  │
  ├→ [스케줄 생성] ─────────── 자동 생성 → 캘린더 뷰
  │     │
  │     ├→ 수동 수정 (셀 토글 + 실시간 검증)
  │     ├→ 재생성 (랜덤 재시도)
  │     ├→ 균등 현황판 (금토일 통계)
  │     └→ 확정
  │
  ├→ [내보내기] ─────────────── 엑셀 / PDF 다운로드
  │
  └→ [이력] ─────────────────── 과거 4주 스케줄 조회
```

### 사이드바 메뉴 구성

```
📊  대시보드           /
👥  직원 관리          /employees
📅  기간 설정          /period
🏖️  고정 휴무          /fixed-leave
📋  스케줄             /schedule
📥  내보내기           /export
📚  이력               /history
──────────────
💾  데이터 백업/복원    (모달)
```

---

## 9. 알고리즘 엔진 설계

### 9.1 입력/출력

```typescript
// engine/types.ts

interface EngineInput {
  employees: Employee[]           // 활성 직원 목록
  startDate: string               // 4주 시작일 (월요일)
  storeClosedDates: string[]      // 매장 지정 휴무일
  fixedLeaves: FixedLeave[]       // 점장이 입력한 고정 휴무
}

interface EngineOutput {
  cells: ScheduleCell[]           // 직원별 28일 배정 결과
  weekendCounts: Record<string, WeekendCount>
  fairnessScore: number           // 균등도 (최대-최소)
  warnings: Warning[]             // 경고 목록
  retryCount: number              // 재시도 횟수
  isValid: boolean                // 전체 검증 통과 여부
}

interface Warning {
  type: 'CONSECUTIVE' | 'FAIRNESS' | 'FIXED_LEAVE_OVERFLOW' | 'CONFLICT'
  employeeId?: string
  date?: string
  message: string
}
```

### 9.2 7단계 파이프라인 (요약)

```
┌─────────────────────────────────────────────────────────┐
│  generateSchedule(input: EngineInput): EngineOutput     │
│                                                         │
│  1. applyFixedLeaves()     고정 휴무 우선 배정           │
│  2. blockManagerDays()     점장/부점장 매장 휴무일 제외   │
│  3. calcRemaining()        주차별 잔여 휴무 횟수 산정     │
│  4. distributeWeekend()    금토일 균등 배분              │
│  5. checkConsecutive()     연속 출근 6일 초과 swap       │
│  6. distributeWeekday()    평일 잔여 랜덤 배분           │
│  7. validate()             검증 + 자동 보정 (5회 재시도)  │
│                                                         │
│  ※ STEP 7 실패 시 STEP 4~6을 최대 5회 재실행            │
└─────────────────────────────────────────────────────────┘
```

### 9.3 알고리즘 핵심 규칙 체크리스트

| # | 규칙 | 유형 | 검증 위치 |
|---|------|------|-----------|
| 1 | 주3회 휴무주: 직원 1인당 주 3회 | Hard | STEP 3, 7 |
| 2 | 주2회 일반주: 직원 1인당 주 2회 | Hard | STEP 3, 7 |
| 3 | 점장/부점장 매장 휴무일 출근 강제 | Hard | STEP 2 |
| 4 | 연속 출근 최대 6일 | Hard | STEP 5, 7 |
| 5 | 금토일 합계 차이 ≤ 1 | Hard(목표) | STEP 4, 7 |
| 6 | 고정 휴무 우선 배정 | Hard | STEP 1 |
| 7 | 고정 휴무 ↔ 매장 휴무일 충돌 차단 (점장/부점장) | Hard | STEP 2 |

---

## 10. 테스트 전략

### 10.1 대상 및 도구

| 레벨 | 도구 | 대상 | 비고 |
|------|------|------|------|
| 유닛 테스트 | Vitest | 알고리즘 엔진 7단계, date-utils | 핵심 — 커버리지 90% |
| 컴포넌트 테스트 | Vitest + Testing Library | CalendarGrid, FairnessDashboard | 주요 UI |
| 수동 테스트 | 브라우저 | 전체 플로우 | 스프린트마다 |

### 10.2 알고리즘 테스트 케이스

```
TC-01  기본 생성: 8명 일반직원, 매장 휴무 0개, 고정 휴무 0건
       → 전원 주2회 휴무, 금토일 합계 차이 ≤ 1

TC-02  매장 지정 휴무주 혼합: 8명, 주3회 2주 + 일반 2주
       → 주3회 주에 3회 / 일반주에 2회 정확히 배정

TC-03  점장/부점장 제외: 점장1 + 부점장1 + 일반6명, 매장 휴무일 2개
       → 점장/부점장 해당일 WORK_LOCKED

TC-04  고정 휴무 충돌: 점장 고정 휴무가 매장 휴무일과 겹침
       → 입력 단계에서 차단 (엔진 도달 전)

TC-05  연속 출근 제약: 6일 연속 출근 강제 시나리오
       → swap으로 해소 또는 경고

TC-06  금토일 균등 경계: 직원 수 vs 금토일 슬롯 불균형
       → 5회 재시도 후 최선 결과

TC-07  고정 휴무 과다: 직원 1명에 고정 휴무 4건 (주별 한도 초과)
       → 경고 반환

TC-08  직원 2명 최소 케이스: 극단적 소규모
       → 정상 생성 + 모든 제약 충족
```

---

## 11. 배포

### 11.1 Vercel 정적 배포

```bash
# vite.config.ts — 빌드 설정
build:
  outDir: dist
  target: esnext

# Vercel 설정
Framework: Vite
Build Command: pnpm build
Output Directory: dist
```

### 11.2 환경변수

> 백엔드가 없으므로 환경변수 없음.  
> 모든 데이터는 사용자 브라우저 LocalStorage에 저장.

### 11.3 주의사항

| 항목 | 설명 |
|------|------|
| 데이터 영속성 | LocalStorage는 브라우저/기기에 종속 — JSON 백업/복원 기능 필수 |
| 용량 한계 | LocalStorage ~5MB — 직원 10명 × 26주기(2년) 충분히 여유 |
| 브라우저 호환 | Chrome, Safari, Edge 최신 버전 지원 |
| HTTPS | Vercel 기본 HTTPS 제공 (PWA 서비스 워커 요구사항) |

---

## 태스크 요약

| Phase | 스프린트 수 | 태스크 수 | 예상 기간 |
|-------|------------|----------|-----------|
| Phase 1 (MVP) | 5 (S0~S4) | 28개 | 2~3주 |
| Phase 2 (완성도) | 3 (S5~S7) | 15개 | 1.5~2주 |
| Phase 3 (확장) | 2 (S8~S9) | 10개 | 1~1.5주 |
| **합계** | **10** | **53개** | **5~6주** |

---

> **다음 단계:** Sprint 0 실행 — `pnpm create vite` 부터 시작합니다.
