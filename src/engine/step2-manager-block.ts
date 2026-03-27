import type { EmployeeScheduleState } from './types'
import type { Warning } from '@/types'

export function blockManagerDays(
  states: EmployeeScheduleState[],
  storeClosedDates: string[],
): Warning[] {
  const warnings: Warning[] = []

  const managers = states.filter(
    (s) => s.role === 'MANAGER' || s.role === 'ASSISTANT_MANAGER',
  )

  for (const mgr of managers) {
    for (const date of storeClosedDates) {
      const existing = mgr.assignments.get(date)

      if (existing === 'OFF_FIXED') {
        warnings.push({
          type: 'CONFLICT',
          employeeId: mgr.employeeId,
          date,
          message: '점장/부점장의 고정 휴무가 매장 지정 휴무일과 충돌합니다.',
        })
        continue
      }

      mgr.assignments.set(date, 'WORK_LOCKED')
    }
  }

  return warnings
}
