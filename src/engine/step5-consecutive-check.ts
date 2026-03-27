import type { EmployeeScheduleState } from './types'
import type { Warning } from '@/types'
import { checkConsecutiveWorkDays, getWeekIndex, shuffle } from './helpers'
import { MAX_CONSECUTIVE_WORK_DAYS } from '@/lib/constants'
import { getWeekRemaining } from './step3-remaining-calc'

export function fixConsecutiveViolations(
  states: EmployeeScheduleState[],
  allDates: string[],
): Warning[] {
  const warnings: Warning[] = []

  for (const state of states) {
    const fullAssignments = new Map<string, string>()
    for (const date of allDates) {
      fullAssignments.set(date, state.assignments.get(date) ?? 'WORK')
    }

    const violations = checkConsecutiveWorkDays(
      fullAssignments,
      allDates,
      MAX_CONSECUTIVE_WORK_DAYS,
    )

    for (const violationDate of violations) {
      const weekIdx = getWeekIndex(violationDate, allDates)
      if (weekIdx < 0) continue

      if (getWeekRemaining(state, weekIdx) > 0 && !state.assignments.has(violationDate)) {
        state.assignments.set(violationDate, 'OFF_RANDOM')
        state.weeklyRemaining[weekIdx]--
        continue
      }

      const swapCandidates = states.filter((other) => {
        if (other.employeeId === state.employeeId) return false
        const otherStatus = other.assignments.get(violationDate)
        if (!otherStatus || otherStatus === 'OFF_FIXED' || otherStatus === 'WORK_LOCKED') return false

        const otherFull = new Map<string, string>()
        for (const d of allDates) {
          otherFull.set(d, other.assignments.get(d) ?? 'WORK')
        }
        otherFull.set(violationDate, 'WORK')
        const otherViolations = checkConsecutiveWorkDays(otherFull, allDates, MAX_CONSECUTIVE_WORK_DAYS)
        return otherViolations.length === 0
      })

      if (swapCandidates.length > 0) {
        const swapWith = shuffle(swapCandidates)[0]
        const otherStatus = swapWith.assignments.get(violationDate)!
        swapWith.assignments.delete(violationDate)
        state.assignments.set(violationDate, otherStatus)
      } else {
        warnings.push({
          type: 'CONSECUTIVE',
          employeeId: state.employeeId,
          date: violationDate,
          message: '연속 출근 위반을 해소할 수 없습니다.',
        })
      }
    }
  }

  return warnings
}
