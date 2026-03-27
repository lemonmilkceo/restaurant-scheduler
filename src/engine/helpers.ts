import { format, addDays, parseISO, getDay } from 'date-fns'
import type { WeekInfo, EmployeeScheduleState } from './types'

export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  let current = parseISO(startDate)
  const end = parseISO(endDate)
  while (current <= end) {
    dates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }
  return dates
}

export function buildWeeks(
  dates: string[],
  storeClosedDates: string[],
): WeekInfo[] {
  const weeks: WeekInfo[] = []
  for (let w = 0; w < 4; w++) {
    const weekDates = dates.slice(w * 7, (w + 1) * 7)
    const hasStoreClosed = weekDates.some((d) => storeClosedDates.includes(d))
    weeks.push({
      weekIndex: w,
      dates: weekDates,
      isTripleWeek: hasStoreClosed,
      baseDaysOff: hasStoreClosed ? 3 : 2,
    })
  }
  return weeks
}

export function isWeekendDay(dateStr: string): boolean {
  const dow = getDay(parseISO(dateStr))
  return dow === 5 || dow === 6 || dow === 0
}

export function isFriday(dateStr: string): boolean {
  return getDay(parseISO(dateStr)) === 5
}

export function isSaturday(dateStr: string): boolean {
  return getDay(parseISO(dateStr)) === 6
}

export function isSunday(dateStr: string): boolean {
  return getDay(parseISO(dateStr)) === 0
}

export function getWeekIndex(dateStr: string, allDates: string[]): number {
  const idx = allDates.indexOf(dateStr)
  return Math.floor(idx / 7)
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function checkConsecutiveWorkDays(
  assignments: Map<string, string>,
  allDates: string[],
  maxConsecutive: number,
): string[] {
  const violations: string[] = []
  let consecutive = 0
  for (const date of allDates) {
    const status = assignments.get(date)
    if (status === 'WORK' || status === 'WORK_LOCKED') {
      consecutive++
      if (consecutive > maxConsecutive) {
        violations.push(date)
      }
    } else {
      consecutive = 0
    }
  }
  return violations
}

export function countOffOnDate(
  states: EmployeeScheduleState[],
  date: string,
): number {
  let count = 0
  for (const s of states) {
    const status = s.assignments.get(date)
    if (status && status !== 'WORK' && status !== 'WORK_LOCKED') {
      count++
    }
  }
  return count
}

export function getMaxOffAllowed(
  totalEmployees: number,
  minAttendance: number,
): number {
  return Math.max(0, totalEmployees - minAttendance)
}
