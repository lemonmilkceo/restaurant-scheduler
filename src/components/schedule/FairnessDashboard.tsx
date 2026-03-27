import type { Employee, WeekendCount } from '@/types'
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FairnessDashboardProps {
  employees: Employee[]
  weekendCounts: Record<string, WeekendCount>
  fairnessScore: number
}

export function FairnessDashboard({
  employees,
  weekendCounts,
  fairnessScore,
}: FairnessDashboardProps) {
  const sorted = [...employees].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      a.name.localeCompare(b.name, 'ko'),
  )

  const isGood = fairnessScore <= 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg">금·토·일 균등 현황</CardTitle>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">균등도:</span>
          <Badge className={isGood ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isGood ? `✅ ${fairnessScore}` : `⚠️ ${fairnessScore}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {/* 모바일: 카드 레이아웃 */}
        <div className="space-y-2 sm:hidden">
          {sorted.map((emp) => {
            const counts = weekendCounts[emp.id] ?? { fri: 0, sat: 0, sun: 0, total: 0 }
            return (
              <div key={emp.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <div>
                  <span className="text-sm font-medium">{emp.name}</span>
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {ROLE_LABELS[emp.role]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span>금<b className="ml-0.5">{counts.fri}</b></span>
                  <span>토<b className="ml-0.5">{counts.sat}</b></span>
                  <span>일<b className="ml-0.5">{counts.sun}</b></span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {counts.total}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* 데스크톱: 테이블 레이아웃 */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">직원</th>
                <th className="px-3 py-2 text-center font-medium">금</th>
                <th className="px-3 py-2 text-center font-medium">토</th>
                <th className="px-3 py-2 text-center font-medium">일</th>
                <th className="px-3 py-2 text-center font-bold">합계</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((emp) => {
                const counts = weekendCounts[emp.id] ?? { fri: 0, sat: 0, sun: 0, total: 0 }
                return (
                  <tr key={emp.id} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">
                      {emp.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {ROLE_LABELS[emp.role]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">{counts.fri}</td>
                    <td className="px-3 py-2 text-center">{counts.sat}</td>
                    <td className="px-3 py-2 text-center">{counts.sun}</td>
                    <td className="px-3 py-2 text-center font-bold">{counts.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
