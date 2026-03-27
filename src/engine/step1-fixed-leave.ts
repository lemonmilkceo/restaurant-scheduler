import type { EmployeeScheduleState, WeekInfo } from './types'
import type { Warning } from '@/types'
import { getWeekIndex } from './helpers'

export function applyFixedLeaves(
  states: EmployeeScheduleState[],
  fixedLeaves: { employeeId: string; date: string }[],
  allDates: string[],
  weeks: WeekInfo[],
  storeClosedDates: string[],
): Warning[] {
  const warnings: Warning[] = []

  for (const fl of fixedLeaves) {
    const state = states.find((s) => s.employeeId === fl.employeeId)
    if (!state) continue
    if (!allDates.includes(fl.date)) continue

    if (storeClosedDates.includes(fl.date)) {
      warnings.push({
        type: 'CONFLICT',
        employeeId: fl.employeeId,
        date: fl.date,
        message: '매장 지정 휴무일에는 고정 휴무를 배정할 수 없습니다.',
      })
      continue
    }

    const weekIdx = getWeekIndex(fl.date, allDates)
    if (weekIdx < 0 || weekIdx >= 4) continue

    state.assignments.set(fl.date, 'OFF_FIXED')
    state.weeklyRemaining[weekIdx]--

    if (state.weeklyRemaining[weekIdx] < 0) {
      warnings.push({
        type: 'FIXED_LEAVE_OVERFLOW',
        employeeId: fl.employeeId,
        date: fl.date,
        message: `${weekIdx + 1}주차 고정 휴무가 주별 한도를 초과합니다.`,
      })
    }
  }

  return warnings
}
