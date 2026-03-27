import type { Employee, ScheduleCell, WeekendCount, Warning, CellStatus } from '@/types'

export interface EngineInput {
  employees: Employee[]
  startDate: string
  endDate: string
  storeClosedDates: string[]
  fixedLeaves: { employeeId: string; date: string }[]
}

export interface EngineOutput {
  cells: ScheduleCell[]
  weekendCounts: Record<string, WeekendCount>
  fairnessScore: number
  warnings: Warning[]
  retryCount: number
  isValid: boolean
}

export interface EmployeeScheduleState {
  employeeId: string
  role: Employee['role']
  weeklyRemaining: number[]
  weekendAccum: WeekendCount
  assignments: Map<string, CellStatus>
}

export interface WeekInfo {
  weekIndex: number
  dates: string[]
  isTripleWeek: boolean
  baseDaysOff: number
}
