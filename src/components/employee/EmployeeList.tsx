import { useState } from 'react'
import type { Employee } from '@/types'
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, UserX, UserCheck } from 'lucide-react'

interface EmployeeListProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onToggleActive: (id: string) => void
}

const roleBadgeColor: Record<string, string> = {
  MANAGER: 'bg-red-100 text-red-800',
  ASSISTANT_MANAGER: 'bg-orange-100 text-orange-800',
  STAFF: 'bg-blue-100 text-blue-800',
}

export function EmployeeList({ employees, onEdit, onToggleActive }: EmployeeListProps) {
  const [showInactive, setShowInactive] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  const filtered = employees
    .filter((e) => showInactive || e.isActive)
    .filter((e) => roleFilter === 'ALL' || e.role === roleFilter)
    .sort((a, b) => {
      const roleA = ROLE_ORDER.indexOf(a.role)
      const roleB = ROLE_ORDER.indexOf(b.role)
      if (roleA !== roleB) return roleA - roleB
      return a.name.localeCompare(b.name, 'ko')
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">전체 직급</option>
          <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
          <option value="ASSISTANT_MANAGER">{ROLE_LABELS.ASSISTANT_MANAGER}</option>
          <option value="STAFF">{ROLE_LABELS.STAFF}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300 h-4 w-4"
          />
          비활성 표시
        </label>
        <span className="ml-auto text-sm text-muted-foreground">
          총 {filtered.length}명
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 sm:p-12 text-center">
          <p className="text-muted-foreground">등록된 직원이 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            위의 '직원 등록' 버튼을 눌러 시작하세요.
          </p>
        </div>
      ) : (
        <>
          {/* 모바일: 카드 레이아웃 */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((employee) => (
              <div
                key={employee.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  !employee.isActive && 'opacity-50 bg-muted/30',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{employee.name}</span>
                    <Badge variant="secondary" className={cn('text-[10px] shrink-0', roleBadgeColor[employee.role])}>
                      {ROLE_LABELS[employee.role]}
                    </Badge>
                  </div>
                  <div className="mt-0.5">
                    <Badge variant={employee.isActive ? 'default' : 'outline'} className="text-[10px]">
                      {employee.isActive ? '활성' : '비활성'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onEdit(employee)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onToggleActive(employee.id)}
                  >
                    {employee.isActive ? (
                      <UserX className="h-4 w-4 text-destructive" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 데스크톱: 테이블 레이아웃 */}
          <div className="overflow-hidden rounded-lg border hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">직급</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr
                    key={employee.id}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/30',
                      !employee.isActive && 'opacity-50',
                    )}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{employee.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={roleBadgeColor[employee.role]}>
                        {ROLE_LABELS[employee.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={employee.isActive ? 'default' : 'outline'}>
                        {employee.isActive ? '활성' : '비활성'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(employee)}
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleActive(employee.id)}
                          title={employee.isActive ? '비활성화' : '활성화'}
                        >
                          {employee.isActive ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
