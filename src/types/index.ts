export type Role = 'MANAGER' | 'ASSISTANT_MANAGER' | 'STAFF'

export type CellStatus =
  | 'WORK'
  | 'OFF_RANDOM'
  | 'OFF_FIXED'
  | 'OFF_STORE'
  | 'WORK_LOCKED'

export interface Employee {
  id: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
}

export interface PeriodConfig {
  id: string
  startDate: string
  endDate: string
  storeClosedDates: string[]
}

export interface FixedLeave {
  employeeId: string
  date: string
}

export interface ScheduleCell {
  employeeId: string
  date: string
  status: CellStatus
  isLocked: boolean
}

export interface WeekendCount {
  fri: number
  sat: number
  sun: number
  total: number
}

export interface Warning {
  type: 'CONSECUTIVE' | 'FAIRNESS' | 'FIXED_LEAVE_OVERFLOW' | 'CONFLICT'
  employeeId?: string
  date?: string
  message: string
}

export interface Schedule {
  id: string
  periodId: string
  cells: ScheduleCell[]
  fairnessScore: number
  weekendCounts: Record<string, WeekendCount>
  warnings: Warning[]
  status: 'DRAFT' | 'CONFIRMED'
  createdAt: string
  confirmedAt?: string
}
