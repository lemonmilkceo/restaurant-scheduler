import { useState, useMemo } from 'react'
import { usePeriodStore } from '@/stores/period-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  format,
  addDays,
  startOfWeek,
  getDay,
  parseISO,
  isMonday,
  eachDayOfInterval,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { DAY_LABELS } from '@/lib/constants'
import { CalendarDays, Trash2 } from 'lucide-react'

function getNextMonday(from: Date): Date {
  const d = startOfWeek(from, { weekStartsOn: 1 })
  return d < from ? addDays(d, 7) : d
}

export default function PeriodSetupPage() {
  const { periods, currentPeriodId, addPeriod, updateStoreClosedDates, setCurrentPeriod, deletePeriod } = usePeriodStore()
  const currentPeriod = periods.find((p) => p.id === currentPeriodId)

  const [startInput, setStartInput] = useState('')

  const nextMonday = useMemo(() => getNextMonday(new Date()), [])

  function handleCreatePeriod() {
    const date = startInput ? parseISO(startInput) : nextMonday
    if (!isMonday(date)) {
      alert('시작일은 반드시 월요일이어야 합니다.')
      return
    }
    const end = addDays(date, 27)
    const existing = periods.find(
      (p) => p.startDate === format(date, 'yyyy-MM-dd'),
    )
    if (existing) {
      if (!confirm('해당 기간의 설정이 이미 있습니다. 덮어쓰시겠습니까?')) return
      deletePeriod(existing.id)
    }
    addPeriod(format(date, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  }

  function toggleStoreClosedDate(dateStr: string) {
    if (!currentPeriod) return
    const dates = currentPeriod.storeClosedDates.includes(dateStr)
      ? currentPeriod.storeClosedDates.filter((d) => d !== dateStr)
      : [...currentPeriod.storeClosedDates, dateStr]
    updateStoreClosedDates(currentPeriod.id, dates)
  }

  const days = useMemo(() => {
    if (!currentPeriod) return []
    return eachDayOfInterval({
      start: parseISO(currentPeriod.startDate),
      end: parseISO(currentPeriod.endDate),
    })
  }, [currentPeriod])

  const weekSummary = useMemo(() => {
    if (!currentPeriod || days.length === 0) return []
    const weeks: { weekNum: number; start: Date; end: Date; isTriple: boolean; closedCount: number }[] = []
    for (let w = 0; w < 4; w++) {
      const weekDays = days.slice(w * 7, (w + 1) * 7)
      const closedInWeek = weekDays.filter((d) =>
        currentPeriod.storeClosedDates.includes(format(d, 'yyyy-MM-dd')),
      )
      weeks.push({
        weekNum: w + 1,
        start: weekDays[0],
        end: weekDays[6],
        isTriple: closedInWeek.length > 0,
        closedCount: closedInWeek.length,
      })
    }
    return weeks
  }, [days, currentPeriod])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">4주 기간 설정</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          스케줄 대상 4주(28일)를 설정하고 매장 지정 휴무일을 지정합니다.
        </p>
      </div>

      {!currentPeriod ? (
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">새 4주 기간 만들기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일 (월요일만 선택 가능)</label>
              <input
                type="date"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="flex h-11 sm:h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                비워두면 다음 월요일({format(nextMonday, 'yyyy-MM-dd')})로 설정됩니다.
              </p>
            </div>
            <Button onClick={handleCreatePeriod} className="w-full sm:w-auto">
              <CalendarDays className="mr-2 h-4 w-4" />
              기간 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="space-y-2 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:justify-between px-3 sm:px-6">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  {format(parseISO(currentPeriod.startDate), 'yyyy년 M월 d일', { locale: ko })}
                  {' ~ '}
                  {format(parseISO(currentPeriod.endDate), 'M월 d일', { locale: ko })}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  날짜를 클릭하여 매장 지정 휴무일을 설정하세요.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => {
                  if (confirm('기간 설정을 삭제하시겠습니까?')) {
                    deletePeriod(currentPeriod.id)
                  }
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                삭제
              </Button>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      'py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold',
                      i >= 4 && 'text-red-500',
                    )}
                  >
                    {day}
                  </div>
                ))}
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isClosed = currentPeriod.storeClosedDates.includes(dateStr)
                  const dayOfWeek = getDay(day)
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6

                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleStoreClosedDate(dateStr)}
                      className={cn(
                        'relative rounded-lg p-2 sm:p-3 text-center text-sm transition-all active:scale-95',
                        'hover:ring-2 hover:ring-primary/50',
                        isClosed
                          ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-600'
                          : isWeekend
                            ? 'bg-amber-50 text-gray-700'
                            : 'bg-white text-gray-700',
                        'border',
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {isClosed && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-300 ring-2 ring-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">주차 요약</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-2">
                {weekSummary.map((week) => (
                  <div
                    key={week.weekNum}
                    className="flex flex-wrap items-center gap-2 sm:gap-4 rounded-lg border p-2.5 sm:p-3"
                  >
                    <Badge variant="secondary" className="min-w-[3rem] justify-center text-xs">
                      {week.weekNum}주차
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {format(week.start, 'M/d')} ~ {format(week.end, 'M/d')}
                    </span>
                    <Badge
                      className={cn(
                        'text-xs',
                        week.isTriple
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {week.isTriple ? `주3회 (지정 ${week.closedCount}일)` : '주2회 일반주'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>
                  주3회: {weekSummary.filter((w) => w.isTriple).length}주 / 일반: {weekSummary.filter((w) => !w.isTriple).length}주
                </span>
                <span>매장 휴무일: {currentPeriod.storeClosedDates.length}일</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {periods.length > 1 && (
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">기간 목록</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-2">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentPeriod(p.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors active:bg-muted',
                    p.id === currentPeriodId ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                  )}
                >
                  <span className="text-xs sm:text-sm font-medium">
                    {format(parseISO(p.startDate), 'yyyy-MM-dd')} ~ {format(parseISO(p.endDate), 'MM-dd')}
                  </span>
                  <Badge variant="outline" className="text-xs">{p.storeClosedDates.length}일 지정</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
