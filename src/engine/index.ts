import type { EngineInput, EngineOutput, EmployeeScheduleState } from './types'
import type { ScheduleCell, CellStatus, Warning, WeekendCount } from '@/types'
import {
  generateDateRange,
  buildWeeks,
  isWeekendDay,
  isFriday,
  isSaturday,
  isSunday,
  getWeekIndex,
  countOffOnDate,
  getMaxOffAllowed,
  checkConsecutiveWorkDays,
} from './helpers'
import { MAX_RETRY_COUNT, MIN_ATTENDANCE, MAX_CONSECUTIVE_WORK_DAYS } from '@/lib/constants'

function initStates(input: EngineInput, allDates: string[]): EmployeeScheduleState[] {
  const weeks = buildWeeks(allDates, input.storeClosedDates)
  return input.employees.map((emp) => ({
    employeeId: emp.id,
    role: emp.role,
    weeklyRemaining: weeks.map((w) => w.baseDaysOff),
    weekendAccum: { fri: 0, sat: 0, sun: 0, total: 0 },
    assignments: new Map<string, CellStatus>(),
  }))
}

function tryGenerate(input: EngineInput): {
  states: EmployeeScheduleState[]
  allDates: string[]
  warnings: Warning[]
} {
  const allDates = generateDateRange(input.startDate, input.endDate)
  const maxOff = getMaxOffAllowed(input.employees.length, MIN_ATTENDANCE)
  const states = initStates(input, allDates)
  const warnings: Warning[] = []

  // ── STEP 1: 고정 휴무 배정 ──
  for (const fl of input.fixedLeaves) {
    const state = states.find((s) => s.employeeId === fl.employeeId)
    if (!state || !allDates.includes(fl.date)) continue
    if (input.storeClosedDates.includes(fl.date)) continue

    const weekIdx = getWeekIndex(fl.date, allDates)
    if (weekIdx < 0 || weekIdx >= 4) continue

    state.assignments.set(fl.date, 'OFF_FIXED')
    state.weeklyRemaining[weekIdx]--
  }

  // ── STEP 2: 점장/부점장 매장 휴무일 출근 고정 ──
  for (const state of states) {
    if (state.role !== 'MANAGER' && state.role !== 'ASSISTANT_MANAGER') continue
    for (const date of input.storeClosedDates) {
      if (!allDates.includes(date)) continue
      if (state.assignments.get(date) === 'OFF_FIXED') {
        warnings.push({
          type: 'CONFLICT',
          employeeId: state.employeeId,
          date,
          message: '점장/부점장 고정 휴무가 매장 휴무일과 충돌합니다.',
        })
        continue
      }
      state.assignments.set(date, 'WORK_LOCKED')
    }
  }

  // ── STEP 3: 날짜별로 정확히 maxOff명 휴무 배정 ──
  for (const date of allDates) {
    const weekIdx = getWeekIndex(date, allDates)
    const currentOff = countOffOnDate(states, date)
    const slotsToFill = maxOff - currentOff

    if (slotsToFill <= 0) continue

    const isStoreClosed = input.storeClosedDates.includes(date)

    const candidates = states.filter((s) => {
      if (s.assignments.has(date)) return false
      if (s.weeklyRemaining[weekIdx] <= 0) return false
      if (isStoreClosed && (s.role === 'MANAGER' || s.role === 'ASSISTANT_MANAGER')) return false
      return true
    })

    candidates.sort((a, b) => {
      const remA = a.weeklyRemaining[weekIdx]
      const remB = b.weeklyRemaining[weekIdx]
      if (remA !== remB) return remB - remA

      if (isWeekendDay(date)) {
        if (a.weekendAccum.total !== b.weekendAccum.total)
          return a.weekendAccum.total - b.weekendAccum.total
        if (isFriday(date)) return a.weekendAccum.fri - b.weekendAccum.fri
        if (isSaturday(date)) return a.weekendAccum.sat - b.weekendAccum.sat
        if (isSunday(date)) return a.weekendAccum.sun - b.weekendAccum.sun
      }

      return Math.random() - 0.5
    })

    const toAssign = Math.min(slotsToFill, candidates.length)
    for (let i = 0; i < toAssign; i++) {
      const chosen = candidates[i]
      const status: CellStatus = isStoreClosed ? 'OFF_STORE' : 'OFF_RANDOM'
      chosen.assignments.set(date, status)
      chosen.weeklyRemaining[weekIdx]--

      if (isFriday(date)) chosen.weekendAccum.fri++
      else if (isSaturday(date)) chosen.weekendAccum.sat++
      else if (isSunday(date)) chosen.weekendAccum.sun++
      if (isWeekendDay(date)) chosen.weekendAccum.total++
    }
  }

  // ── STEP 4: 연속 출근 6일 초과 체크 ──
  for (const state of states) {
    const full = new Map<string, string>()
    for (const d of allDates) full.set(d, state.assignments.get(d) ?? 'WORK')
    const violations = checkConsecutiveWorkDays(full, allDates, MAX_CONSECUTIVE_WORK_DAYS)
    for (const v of violations) {
      warnings.push({
        type: 'CONSECUTIVE',
        employeeId: state.employeeId,
        date: v,
        message: `연속 출근 ${MAX_CONSECUTIVE_WORK_DAYS}일 초과`,
      })
    }
  }

  return { states, allDates, warnings }
}

export function generateSchedule(input: EngineInput): EngineOutput {
  const allDates = generateDateRange(input.startDate, input.endDate)
  let bestResult: EngineOutput | null = null

  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    const { states, warnings } = tryGenerate(input)

    const cells: ScheduleCell[] = []
    for (const state of states) {
      for (const date of allDates) {
        const status = state.assignments.get(date) ?? 'WORK'
        cells.push({
          employeeId: state.employeeId,
          date,
          status,
          isLocked: status === 'OFF_FIXED' || status === 'WORK_LOCKED',
        })
      }
    }

    const weekendCounts: Record<string, WeekendCount> = {}
    for (const state of states) {
      weekendCounts[state.employeeId] = { ...state.weekendAccum }
    }

    const totals = states.map((s) => s.weekendAccum.total)
    const fairnessScore =
      totals.length > 0 ? Math.max(...totals) - Math.min(...totals) : 0

    const hasConsecutive = warnings.some((w) => w.type === 'CONSECUTIVE')
    const isValid = fairnessScore <= 1 && !hasConsecutive

    const result: EngineOutput = {
      cells,
      weekendCounts,
      fairnessScore,
      warnings,
      retryCount: attempt,
      isValid,
    }

    if (isValid) return result

    if (!bestResult || fairnessScore < bestResult.fairnessScore) {
      bestResult = result
    }
  }

  return bestResult!
}
