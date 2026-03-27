import type { EmployeeScheduleState, WeekInfo } from './types'
import type { Warning, WeekendCount } from '@/types'
import { checkConsecutiveWorkDays, countOffOnDate, getMaxOffAllowed } from './helpers'
import { MAX_CONSECUTIVE_WORK_DAYS } from '@/lib/constants'

export interface ValidationResult {
  isValid: boolean
  fairnessScore: number
  weekendCounts: Record<string, WeekendCount>
  warnings: Warning[]
}

export function validate(
  states: EmployeeScheduleState[],
  allDates: string[],
  weeks: WeekInfo[],
  minAttendance: number,
): ValidationResult {
  const warnings: Warning[] = []

  // ① 주별 총 휴무 횟수 검증
  for (const state of states) {
    for (let w = 0; w < 4; w++) {
      const weekDates = allDates.slice(w * 7, (w + 1) * 7)
      const offCount = weekDates.filter((d) => {
        const s = state.assignments.get(d)
        return s && s !== 'WORK' && s !== 'WORK_LOCKED'
      }).length

      const expected = weeks[w].baseDaysOff
      if (offCount !== expected) {
        warnings.push({
          type: 'FAIRNESS',
          employeeId: state.employeeId,
          message: `${w + 1}주차 휴무 ${offCount}회 (기대 ${expected}회)`,
        })
      }
    }
  }

  // ② 금토일 균등도
  const weekendCounts: Record<string, WeekendCount> = {}
  for (const state of states) {
    weekendCounts[state.employeeId] = { ...state.weekendAccum }
  }

  const totals = states.map((s) => s.weekendAccum.total)
  const fairnessScore = totals.length > 0
    ? Math.max(...totals) - Math.min(...totals)
    : 0

  if (fairnessScore >= 2) {
    warnings.push({
      type: 'FAIRNESS',
      message: `금토일 균등도 미달: 최대-최소 차이 ${fairnessScore}`,
    })
  }

  // ③ 최소 출근 인원 검증
  const maxOff = getMaxOffAllowed(states.length, minAttendance)
  for (const date of allDates) {
    const offCount = countOffOnDate(states, date)
    if (offCount > maxOff) {
      const workCount = states.length - offCount
      warnings.push({
        type: 'FAIRNESS',
        date,
        message: `출근 인원 ${workCount}명 (최소 ${minAttendance}명 필요)`,
      })
    }
  }

  // ④ 연속 출근 최종 확인
  for (const state of states) {
    const fullAssignments = new Map<string, string>()
    for (const date of allDates) {
      fullAssignments.set(date, state.assignments.get(date) ?? 'WORK')
    }
    const violations = checkConsecutiveWorkDays(fullAssignments, allDates, MAX_CONSECUTIVE_WORK_DAYS)
    if (violations.length > 0) {
      warnings.push({
        type: 'CONSECUTIVE',
        employeeId: state.employeeId,
        message: `연속 출근 ${MAX_CONSECUTIVE_WORK_DAYS}일 초과 위반 (${violations.length}건)`,
      })
    }
  }

  const hasHardViolation = warnings.some(
    (w) => w.type === 'CONSECUTIVE' || (w.type === 'FAIRNESS' && w.message.includes('균등도')),
  )

  return {
    isValid: !hasHardViolation,
    fairnessScore,
    weekendCounts,
    warnings,
  }
}
