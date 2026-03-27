import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEmployeeStore } from '@/stores/employee-store'
import { usePeriodStore } from '@/stores/period-store'
import { useScheduleStore } from '@/stores/schedule-store'
import { Users, CalendarDays, CalendarOff, ClipboardList, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function DashboardPage() {
  const { employees } = useEmployeeStore()
  const { getCurrentPeriod, fixedLeaves } = usePeriodStore()
  const { schedules } = useScheduleStore()

  const activeCount = employees.filter((e) => e.isActive).length
  const currentPeriod = getCurrentPeriod()
  const currentSchedule = currentPeriod
    ? schedules.find((s) => s.periodId === currentPeriod.id)
    : undefined

  const steps = [
    {
      num: 1,
      label: '직원 등록',
      done: activeCount > 0,
      to: '/employees',
      icon: Users,
    },
    {
      num: 2,
      label: '기간 설정',
      done: !!currentPeriod,
      to: '/period',
      icon: CalendarDays,
    },
    {
      num: 3,
      label: '고정 휴무 입력',
      done: fixedLeaves.length > 0,
      to: '/fixed-leave',
      icon: CalendarOff,
      optional: true,
    },
    {
      num: 4,
      label: '스케줄 생성',
      done: !!currentSchedule,
      to: '/schedule',
      icon: ClipboardList,
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">대시보드</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          식당 직원 스케줄을 한눈에 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">활성 직원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{activeCount}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">현재 기간</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xs sm:text-sm font-bold">
              {currentPeriod
                ? `${format(new Date(currentPeriod.startDate), 'M/d', { locale: ko })} ~ ${format(new Date(currentPeriod.endDate), 'M/d', { locale: ko })}`
                : '미설정'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">고정 휴무</CardTitle>
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{fixedLeaves.length}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">스케줄 상태</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xs sm:text-sm font-bold">
              {currentSchedule
                ? currentSchedule.status === 'CONFIRMED'
                  ? '확정됨'
                  : '초안'
                : '미생성'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg">진행 단계</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-2 sm:space-y-3">
            {steps.map((step) => (
              <Link
                key={step.num}
                to={step.to}
                className="flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold shrink-0 ${
                    step.done
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.done ? '✓' : step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {step.label}
                    {step.optional && (
                      <span className="ml-1.5 text-[10px] sm:text-xs text-muted-foreground">(선택)</span>
                    )}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {!activeCount && (
        <div className="rounded-lg border-2 border-dashed border-primary/30 p-6 sm:p-8 text-center">
          <h3 className="text-base sm:text-lg font-semibold">시작하기</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            직원을 먼저 등록하면 스케줄을 생성할 수 있습니다.
          </p>
          <Link to="/employees">
            <Button className="mt-4">직원 등록하러 가기</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
