import type { EmployeeScheduleState } from './types'

export function calcRemaining(): void {
  // weeklyRemaining was initialized to baseDaysOff per week.
  // STEP 1 already subtracted fixed leaves.
  // Nothing extra to do here — remaining is already correct.
  // This step exists for clarity and future extensibility.
}

export function getTotalRemaining(state: EmployeeScheduleState): number {
  return state.weeklyRemaining.reduce((sum, r) => sum + Math.max(0, r), 0)
}

export function getWeekRemaining(state: EmployeeScheduleState, weekIdx: number): number {
  return Math.max(0, state.weeklyRemaining[weekIdx])
}
