import type { EmployeeScheduleState } from './types'
import {
  isWeekendDay,
  isFriday,
  isSaturday,
  isSunday,
  getWeekIndex,
  shuffle,
  countOffOnDate,
  getMaxOffAllowed,
} from './helpers'
import { getWeekRemaining } from './step3-remaining-calc'

export function distributeWeekends(
  states: EmployeeScheduleState[],
  allDates: string[],
  storeClosedDates: string[],
  minAttendance: number,
): void {
  const weekendDates = allDates.filter(isWeekendDay)
  const maxOff = getMaxOffAllowed(states.length, minAttendance)

  let changed = true
  while (changed) {
    changed = false

    for (const date of weekendDates) {
      const weekIdx = getWeekIndex(date, allDates)
      const isStoreClosed = storeClosedDates.includes(date)

      if (countOffOnDate(states, date) >= maxOff) continue

      const candidates = states.filter((s) => {
        if (s.assignments.has(date)) return false
        if (getWeekRemaining(s, weekIdx) <= 0) return false
        if (
          isStoreClosed &&
          (s.role === 'MANAGER' || s.role === 'ASSISTANT_MANAGER')
        ) {
          return false
        }
        return true
      })

      if (candidates.length === 0) continue

      candidates.sort((a, b) => {
        if (a.weekendAccum.total !== b.weekendAccum.total) {
          return a.weekendAccum.total - b.weekendAccum.total
        }
        if (isFriday(date)) return a.weekendAccum.fri - b.weekendAccum.fri
        if (isSaturday(date)) return a.weekendAccum.sat - b.weekendAccum.sat
        if (isSunday(date)) return a.weekendAccum.sun - b.weekendAccum.sun
        return 0
      })

      const minTotal = candidates[0].weekendAccum.total
      const topCandidates = candidates.filter((c) => c.weekendAccum.total === minTotal)
      const chosen = shuffle(topCandidates)[0]

      const status = isStoreClosed ? ('OFF_STORE' as const) : ('OFF_RANDOM' as const)
      chosen.assignments.set(date, status)
      chosen.weeklyRemaining[weekIdx]--

      if (isFriday(date)) chosen.weekendAccum.fri++
      else if (isSaturday(date)) chosen.weekendAccum.sat++
      else if (isSunday(date)) chosen.weekendAccum.sun++
      chosen.weekendAccum.total++

      changed = true
    }
  }
}
