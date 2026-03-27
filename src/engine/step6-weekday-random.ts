import type { EmployeeScheduleState } from './types'
import {
  isWeekendDay,
  shuffle,
  countOffOnDate,
  getMaxOffAllowed,
} from './helpers'
import { getWeekRemaining } from './step3-remaining-calc'

export function distributeWeekdays(
  states: EmployeeScheduleState[],
  allDates: string[],
  storeClosedDates: string[],
  minAttendance: number,
): void {
  const maxOff = getMaxOffAllowed(states.length, minAttendance)

  for (const state of states) {
    for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
      let remaining = getWeekRemaining(state, weekIdx)
      if (remaining <= 0) continue

      const weekDates = allDates.slice(weekIdx * 7, (weekIdx + 1) * 7)

      const weekdays = shuffle(
        weekDates.filter((d) => !state.assignments.has(d) && !isWeekendDay(d)),
      )
      const weekends = shuffle(
        weekDates.filter((d) => !state.assignments.has(d) && isWeekendDay(d)),
      )
      const availableDays = [...weekdays, ...weekends]

      for (const day of availableDays) {
        if (remaining <= 0) break
        if (countOffOnDate(states, day) >= maxOff) continue

        const isStoreClosed = storeClosedDates.includes(day)
        if (
          isStoreClosed &&
          (state.role === 'MANAGER' || state.role === 'ASSISTANT_MANAGER')
        ) {
          continue
        }

        const status = isStoreClosed ? ('OFF_STORE' as const) : ('OFF_RANDOM' as const)
        state.assignments.set(day, status)
        state.weeklyRemaining[weekIdx]--
        remaining--
      }
    }
  }
}
