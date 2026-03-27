import type { Role, CellStatus } from '@/types'

export const ROLE_LABELS: Record<Role, string> = {
  MANAGER: '점장',
  ASSISTANT_MANAGER: '부점장',
  STAFF: '직원',
}

export const ROLE_ORDER: Role[] = ['MANAGER', 'ASSISTANT_MANAGER', 'STAFF']

export const CELL_STATUS_LABELS: Record<CellStatus, string> = {
  WORK: '출근',
  OFF_RANDOM: '휴무',
  OFF_FIXED: '고정',
  OFF_STORE: '휴무★',
  WORK_LOCKED: '출근고정',
}

export const CELL_COLORS: Record<CellStatus, { bg: string; text: string }> = {
  WORK:        { bg: 'bg-white',            text: 'text-gray-400' },
  OFF_RANDOM:  { bg: 'bg-blue-100',         text: 'text-blue-800' },
  OFF_FIXED:   { bg: 'bg-purple-100',       text: 'text-purple-800' },
  OFF_STORE:   { bg: 'bg-blue-200',         text: 'text-blue-900' },
  WORK_LOCKED: { bg: 'bg-gray-100',         text: 'text-gray-500' },
}

export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

export const WEEKEND_HIGHLIGHT_BG = 'bg-amber-50'
export const STORE_CLOSED_HIGHLIGHT_BG = 'bg-sky-50'

export const MAX_CONSECUTIVE_WORK_DAYS = 6
export const MAX_RETRY_COUNT = 5
export const WEEKS_IN_CYCLE = 4
export const DAYS_IN_CYCLE = 28
export const MIN_ATTENDANCE = 5
