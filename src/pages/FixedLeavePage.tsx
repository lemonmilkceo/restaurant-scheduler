import { useMemo, useState } from 'react'
import { useEmployeeStore } from '@/stores/employee-store'
import { usePeriodStore } from '@/stores/period-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FixedLeavePage() {
  const { employees } = useEmployeeStore()
  const { getCurrentPeriod, fixedLeaves, addFixedLeave, removeFixedLeave } = usePeriodStore()
  const [activeWeek, setActiveWeek] = useState(0)

  const period = getCurrentPeriod()
  const activeEmployees = employees
    .filter((e) => e.isActive)
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name, 'ko'))

  const days = useMemo(() => {
    if (!period) return []
    return eachDayOfInterval({
      start: parseISO(period.startDate),
      end: parseISO(period.endDate),
    })
  }, [period])

  const weeks = useMemo(() => {
    const w: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7))
    }
    return w
  }, [days])

  function isStoreClosedDay(dateStr: string) {
    return period?.storeClosedDates.includes(dateStr) ?? false
  }

  function handleToggle(employeeId: string, dateStr: string) {
    if (isStoreClosedDay(dateStr)) {
      alert('매장 지정 휴무일에는 고정 휴무를 설정할 수 없습니다.\n(스케줄 생성 시 알고리즘이 자동 배정합니다)')
      return
    }
    const exists = fixedLeaves.some(
      (fl) => fl.employeeId === employeeId && fl.date === dateStr,
    )
    if (exists) {
      removeFixedLeave(employeeId, dateStr)
    } else {
      addFixedLeave(employeeId, dateStr)
    }
  }

  const leavesPerDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const fl of fixedLeaves) {
      map[fl.date] = (map[fl.date] || 0) + 1
    }
    return map
  }, [fixedLeaves])

  if (!period) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">고정 휴무 입력</h1>
        <div className="rounded-lg border-2 border-dashed p-8 sm:p-12 text-center">
          <p className="text-muted-foreground">기간을 먼저 설정해 주세요.</p>
          <Link to="/period">
            <Button className="mt-4" variant="outline">기간 설정하러 가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (activeEmployees.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">고정 휴무 입력</h1>
        <div className="rounded-lg border-2 border-dashed p-8 sm:p-12 text-center">
          <p className="text-muted-foreground">직원을 먼저 등록해 주세요.</p>
          <Link to="/employees">
            <Button className="mt-4" variant="outline">직원 등록하러 가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  function renderTable(daysToRender: Date[]) {
    return (
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white border-b border-r px-2 py-2 text-left min-w-[72px] sm:min-w-[80px]">
              직원
            </th>
            {daysToRender.map((day) => {
              const dayOfWeek = getDay(day)
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6
              const dateStr = format(day, 'yyyy-MM-dd')
              const isClosed = period!.storeClosedDates.includes(dateStr)
              const overloaded = (leavesPerDate[dateStr] || 0) >= Math.ceil(activeEmployees.length * 0.4)

              return (
                <th
                  key={dateStr}
                  className={cn(
                    'border-b px-0.5 py-1 text-center min-w-[44px] sm:min-w-[36px]',
                    isWeekend && 'bg-amber-50',
                    isClosed && 'bg-sky-100',
                    overloaded && 'bg-red-50',
                  )}
                >
                  <div className={cn('text-[10px]', isWeekend && 'text-red-500')}>
                    {['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}
                  </div>
                  <div className="font-bold">{format(day, 'd')}</div>
                  {overloaded && <div className="text-[8px] text-red-500">과밀</div>}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {activeEmployees.map((emp) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="sticky left-0 z-10 bg-white border-b border-r px-2 py-1.5 font-medium whitespace-nowrap">
                <span className="text-[11px] sm:text-xs">{emp.name}</span>
                <span className="ml-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                  {ROLE_LABELS[emp.role]}
                </span>
              </td>
              {daysToRender.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isFixed = fixedLeaves.some(
                  (fl) => fl.employeeId === emp.id && fl.date === dateStr,
                )
                const blocked = isStoreClosedDay(dateStr)

                return (
                  <td
                    key={dateStr}
                    className={cn(
                      'border-b px-0.5 py-0.5 text-center transition-colors',
                      blocked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer active:scale-95',
                    )}
                    onClick={() => !blocked && handleToggle(emp.id, dateStr)}
                  >
                    {isFixed ? (
                      <div className="rounded bg-purple-100 text-purple-800 py-1.5 sm:py-1 text-[10px] font-bold">
                        고정
                      </div>
                    ) : blocked ? (
                      <div className="rounded bg-gray-200 text-gray-400 py-1.5 sm:py-1 text-[10px]">
                        —
                      </div>
                    ) : (
                      <div className="rounded py-1.5 sm:py-1 text-[10px] text-gray-300 hover:bg-purple-50 active:bg-purple-100">
                        ·
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">고정 휴무 입력</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          직원별로 원하는 휴무 날짜를 직접 지정합니다. 셀을 클릭하면 토글됩니다.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            {format(parseISO(period.startDate), 'M/d', { locale: ko })} ~{' '}
            {format(parseISO(period.endDate), 'M/d', { locale: ko })}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {/* 모바일: 주 단위 탭 */}
          <div className="flex gap-1 mb-3 lg:hidden">
            {weeks.map((_, i) => (
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

          {/* 모바일: 선택된 주만 */}
          <div className="overflow-x-auto lg:hidden">
            {weeks[activeWeek] && renderTable(weeks[activeWeek])}
          </div>

          {/* 데스크톱: 전체 */}
          <div className="overflow-x-auto hidden lg:block">
            {renderTable(days)}
          </div>
        </CardContent>
      </Card>

      {fixedLeaves.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">등록된 고정 휴무 ({fixedLeaves.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {fixedLeaves.map((fl) => {
                const emp = employees.find((e) => e.id === fl.employeeId)
                return (
                  <Badge
                    key={`${fl.employeeId}-${fl.date}`}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    {emp?.name} · {format(parseISO(fl.date), 'M/d(E)', { locale: ko })}
                    <button
                      onClick={() => removeFixedLeave(fl.employeeId, fl.date)}
                      className="ml-1 rounded-full p-1 hover:bg-gray-300 active:bg-gray-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
