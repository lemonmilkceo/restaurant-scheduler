import { useMemo, useState } from 'react'
import type { ScheduleCell, Employee, Warning } from '@/types'
import { ROLE_LABELS, ROLE_ORDER, CELL_COLORS, CELL_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { format, parseISO, getDay } from 'date-fns'

interface CalendarGridProps {
  employees: Employee[]
  cells: ScheduleCell[]
  startDate: string
  endDate: string
  storeClosedDates: string[]
  warnings: Warning[]
  onCellClick?: (employeeId: string, date: string) => void
  editable?: boolean
}

export function CalendarGrid({
  employees,
  cells,
  startDate,
  endDate,
  storeClosedDates,
  warnings,
  onCellClick,
  editable = false,
}: CalendarGridProps) {
  const [activeWeek, setActiveWeek] = useState(0)

  const dates = useMemo(() => {
    const result: string[] = []
    let current = parseISO(startDate)
    const end = parseISO(endDate)
    while (current <= end) {
      result.push(format(current, 'yyyy-MM-dd'))
      current = new Date(current.getTime() + 86400000)
    }
    return result
  }, [startDate, endDate])

  const weeks = useMemo(() => {
    const w: string[][] = []
    for (let i = 0; i < dates.length; i += 7) {
      w.push(dates.slice(i, i + 7))
    }
    return w
  }, [dates])

  const sortedEmployees = useMemo(
    () =>
      [...employees].sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
          a.name.localeCompare(b.name, 'ko'),
      ),
    [employees],
  )

  const cellMap = useMemo(() => {
    const map = new Map<string, ScheduleCell>()
    for (const cell of cells) {
      map.set(`${cell.employeeId}:${cell.date}`, cell)
    }
    return map
  }, [cells])

  const consecutiveWarningSet = useMemo(() => {
    const set = new Set<string>()
    for (const w of warnings) {
      if (w.type === 'CONSECUTIVE' && w.employeeId) {
        set.add(w.employeeId)
      }
    }
    return set
  }, [warnings])

  const attendanceSummary = useMemo(() => {
    const summary: Record<string, { work: number; total: number }> = {}
    for (const date of dates) {
      let workCount = 0
      for (const emp of sortedEmployees) {
        const cell = cellMap.get(`${emp.id}:${date}`)
        if (!cell || cell.status === 'WORK' || cell.status === 'WORK_LOCKED') {
          workCount++
        }
      }
      summary[date] = { work: workCount, total: sortedEmployees.length }
    }
    return summary
  }, [dates, sortedEmployees, cellMap])

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  function renderTable(datesToRender: string[], showWeekDividers: boolean) {
    return (
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-white border-b border-r px-2 py-2 text-left min-w-[72px] sm:min-w-[80px]">
              직원
            </th>
            {datesToRender.map((date, idx) => {
              const globalIdx = dates.indexOf(date)
              const dow = getDay(parseISO(date))
              const isWeekend = dow === 5 || dow === 6 || dow === 0
              const isClosed = storeClosedDates.includes(date)
              const weekNum = Math.floor(globalIdx / 7) + 1
              const isWeekStart = showWeekDividers && globalIdx % 7 === 0 && globalIdx > 0

              return (
                <th
                  key={date}
                  className={cn(
                    'border-b px-0.5 py-1 text-center min-w-[44px] sm:min-w-[40px]',
                    isWeekend && 'bg-amber-50',
                    isClosed && 'bg-sky-100',
                    isWeekStart && 'border-l-2 border-l-gray-300',
                  )}
                >
                  {showWeekDividers && globalIdx % 7 === 0 && (
                    <div className="text-[9px] text-muted-foreground font-bold mb-0.5">
                      {weekNum}W
                    </div>
                  )}
                  <div className={cn('text-[10px]', isWeekend && 'text-red-500')}>
                    {dayLabels[dow]}
                  </div>
                  <div className="font-bold">{format(parseISO(date), 'd')}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((emp) => {
            const hasWarning = consecutiveWarningSet.has(emp.id)
            return (
              <tr
                key={emp.id}
                className={cn(
                  'hover:bg-gray-50/50 transition-colors',
                  hasWarning && 'ring-1 ring-inset ring-orange-400',
                )}
              >
                <td className="sticky left-0 z-10 bg-white border-b border-r px-2 py-1.5 font-medium whitespace-nowrap">
                  <span className="text-[11px] sm:text-xs">{emp.name}</span>
                  <span className="ml-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                    {ROLE_LABELS[emp.role]}
                  </span>
                </td>
                {datesToRender.map((date) => {
                  const globalIdx = dates.indexOf(date)
                  const cell = cellMap.get(`${emp.id}:${date}`)
                  const status = cell?.status ?? 'WORK'
                  const isLocked = cell?.isLocked ?? false
                  const colors = CELL_COLORS[status]
                  const isWeekStart =
                    showWeekDividers && globalIdx % 7 === 0 && globalIdx > 0
                  const isOff = status !== 'WORK' && status !== 'WORK_LOCKED'

                  return (
                    <td
                      key={date}
                      className={cn(
                        'border-b px-0 py-0.5 text-center transition-colors',
                        isWeekStart && 'border-l-2 border-l-gray-300',
                        editable &&
                          !isLocked &&
                          'cursor-pointer active:scale-95 hover:ring-2 hover:ring-primary/30',
                        editable && isLocked && 'cursor-not-allowed',
                      )}
                      onClick={() => {
                        if (editable && !isLocked && onCellClick) {
                          onCellClick(emp.id, date)
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'mx-0.5 rounded py-1.5 sm:py-1 text-[10px] sm:text-[10px] font-medium',
                          colors.bg,
                          colors.text,
                        )}
                      >
                        {isOff ? CELL_STATUS_LABELS[status] : ''}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="sticky left-0 z-10 bg-gray-50 border-t border-r px-2 py-1.5 text-[10px] font-semibold">
              출근
            </td>
            {datesToRender.map((date) => {
              const globalIdx = dates.indexOf(date)
              const summary = attendanceSummary[date]
              const isWeekStart =
                showWeekDividers && globalIdx % 7 === 0 && globalIdx > 0
              return (
                <td
                  key={date}
                  className={cn(
                    'border-t px-0.5 py-1.5 text-center text-[10px] font-semibold',
                    isWeekStart && 'border-l-2 border-l-gray-300',
                  )}
                >
                  {summary?.work}/{summary?.total}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    )
  }

  return (
    <div>
      {/* 모바일: 주 단위 탭 */}
      <div className="flex gap-1 mb-3 lg:hidden">
        {weeks.map((weekDates, i) => (
          <button
            key={i}
            onClick={() => setActiveWeek(i)}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors',
              activeWeek === i
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {i + 1}주차
          </button>
        ))}
      </div>

      {/* 모바일: 선택된 주만 표시 */}
      <div className="overflow-x-auto lg:hidden">
        {weeks[activeWeek] && renderTable(weeks[activeWeek], false)}
      </div>

      {/* 데스크톱: 전체 28일 표시 */}
      <div className="overflow-x-auto hidden lg:block">
        {renderTable(dates, true)}
      </div>
    </div>
  )
}
