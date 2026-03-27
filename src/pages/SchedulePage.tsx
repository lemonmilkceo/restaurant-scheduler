import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEmployeeStore } from '@/stores/employee-store'
import { usePeriodStore } from '@/stores/period-store'
import { useScheduleStore } from '@/stores/schedule-store'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { FairnessDashboard } from '@/components/schedule/FairnessDashboard'
import { generateSchedule } from '@/engine'
import type { Schedule, CellStatus } from '@/types'
import { Wand2, RefreshCw, CheckCircle, AlertTriangle, Download, Loader2 } from 'lucide-react'
import { downloadSchedulePdf } from '@/lib/generate-pdf'

export default function SchedulePage() {
  const employees = useEmployeeStore((s) => s.employees)
  const activeEmployees = employees.filter((e) => e.isActive)
  const { getCurrentPeriod, fixedLeaves } = usePeriodStore()
  const { addSchedule, getScheduleForPeriod, updateCells, confirmSchedule } = useScheduleStore()
  const currentPeriod = getCurrentPeriod()

  const schedule = currentPeriod
    ? getScheduleForPeriod(currentPeriod.id)
    : undefined

  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleGenerate = useCallback(() => {
    if (!currentPeriod || activeEmployees.length === 0) return
    setIsGenerating(true)

    setTimeout(() => {
      const result = generateSchedule({
        employees: activeEmployees,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        storeClosedDates: currentPeriod.storeClosedDates,
        fixedLeaves: fixedLeaves.filter((fl) =>
          activeEmployees.some((e) => e.id === fl.employeeId),
        ),
      })

      const newSchedule: Schedule = {
        id: crypto.randomUUID(),
        periodId: currentPeriod.id,
        cells: result.cells,
        fairnessScore: result.fairnessScore,
        weekendCounts: result.weekendCounts,
        warnings: result.warnings,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      }

      addSchedule(newSchedule)
      setIsGenerating(false)
    }, 100)
  }, [currentPeriod, activeEmployees, fixedLeaves, addSchedule])

  const handleCellClick = useCallback(
    (employeeId: string, date: string) => {
      if (!schedule || schedule.status === 'CONFIRMED') return

      const newCells = schedule.cells.map((cell) => {
        if (cell.employeeId !== employeeId || cell.date !== date) return cell
        if (cell.isLocked) return cell

        const newStatus: CellStatus =
          cell.status === 'WORK' ? 'OFF_RANDOM' : 'WORK'
        return { ...cell, status: newStatus }
      })

      updateCells(schedule.id, newCells)
    },
    [schedule, updateCells],
  )

  const handleConfirm = useCallback(async () => {
    if (!schedule || !currentPeriod) return
    if (!confirm('스케줄을 확정하시겠습니까?\n확정 후 PDF 스케줄표가 자동 다운로드됩니다.')) return

    confirmSchedule(schedule.id)

    setIsDownloading(true)
    try {
      await downloadSchedulePdf({
        employees: activeEmployees,
        cells: schedule.cells,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        storeClosedDates: currentPeriod.storeClosedDates,
      })
    } catch (e) {
      console.error('PDF 생성 실패:', e)
      alert('PDF 다운로드에 실패했습니다. 스케줄은 확정되었습니다.')
    } finally {
      setIsDownloading(false)
    }
  }, [schedule, currentPeriod, activeEmployees, confirmSchedule])

  const handleDownloadPdf = useCallback(async () => {
    if (!schedule || !currentPeriod) return
    setIsDownloading(true)
    try {
      await downloadSchedulePdf({
        employees: activeEmployees,
        cells: schedule.cells,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        storeClosedDates: currentPeriod.storeClosedDates,
      })
    } catch (e) {
      console.error('PDF 생성 실패:', e)
      alert('PDF 다운로드에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }, [schedule, currentPeriod, activeEmployees])

  if (!currentPeriod) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">스케줄</h1>
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
        <h1 className="text-xl sm:text-2xl font-bold">스케줄</h1>
        <div className="rounded-lg border-2 border-dashed p-8 sm:p-12 text-center">
          <p className="text-muted-foreground">직원을 먼저 등록해 주세요.</p>
          <Link to="/employees">
            <Button className="mt-4" variant="outline">직원 등록하러 가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">스케줄</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            직원 {activeEmployees.length}명 · 매장 휴무일 {currentPeriod.storeClosedDates.length}일
            · 고정 휴무 {fixedLeaves.length}건
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 sm:flex-none"
            size="default"
          >
            {schedule ? (
              <>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                재생성
              </>
            ) : (
              <>
                <Wand2 className="mr-1.5 h-4 w-4" />
                자동 생성
              </>
            )}
          </Button>
          {schedule && schedule.status === 'DRAFT' && (
            <Button
              variant="outline"
              onClick={handleConfirm}
              disabled={isDownloading}
              className="flex-1 sm:flex-none"
            >
              {isDownloading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1.5 h-4 w-4" />
              )}
              {isDownloading ? 'PDF 생성 중...' : '확정 + PDF'}
            </Button>
          )}
          {schedule && schedule.status === 'CONFIRMED' && (
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex-1 sm:flex-none"
            >
              {isDownloading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              {isDownloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
            </Button>
          )}
        </div>
      </div>

      {schedule && (
        <>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className={schedule.fairnessScore <= 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              균등도: {schedule.fairnessScore <= 1 ? '✅' : '⚠️'} {schedule.fairnessScore}
            </Badge>
            <Badge variant={schedule.status === 'CONFIRMED' ? 'default' : 'outline'}>
              {schedule.status === 'CONFIRMED' ? '확정됨' : '초안'}
            </Badge>
            {schedule.warnings.filter((w) => w.type === 'CONSECUTIVE').length > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                <AlertTriangle className="mr-1 h-3 w-3" />
                연속 출근 경고
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">4주 캘린더</CardTitle>
              {schedule.status === 'DRAFT' && (
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  셀을 클릭하여 출근/휴무를 전환할 수 있습니다.
                </p>
              )}
            </CardHeader>
            <CardContent className="p-1.5 sm:p-2">
              <CalendarGrid
                employees={activeEmployees}
                cells={schedule.cells}
                startDate={currentPeriod.startDate}
                endDate={currentPeriod.endDate}
                storeClosedDates={currentPeriod.storeClosedDates}
                warnings={schedule.warnings}
                onCellClick={handleCellClick}
                editable={schedule.status === 'DRAFT'}
              />
            </CardContent>
          </Card>

          <FairnessDashboard
            employees={activeEmployees}
            weekendCounts={schedule.weekendCounts}
            fairnessScore={schedule.fairnessScore}
          />

          {schedule.warnings.length > 0 && (
            <Card>
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">경고 사항</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ul className="space-y-1.5">
                  {schedule.warnings.map((w, i) => {
                    const emp = employees.find((e) => e.id === w.employeeId)
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-500" />
                        <span>
                          {emp && <strong>{emp.name}</strong>} {w.message}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!schedule && (
        <Card>
          <CardContent className="text-center py-12 sm:py-16">
            <Wand2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="mt-4 text-base sm:text-lg font-medium">스케줄을 생성해 주세요</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              '자동 생성' 버튼을 누르면 모든 규칙을 반영하여 자동으로 배정합니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
