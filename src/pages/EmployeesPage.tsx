import { useState } from 'react'
import type { Employee, Role } from '@/types'
import { useEmployeeStore } from '@/stores/employee-store'
import { Button } from '@/components/ui/button'
import { EmployeeForm } from '@/components/employee/EmployeeForm'
import { EmployeeList } from '@/components/employee/EmployeeList'
import { UserPlus } from 'lucide-react'

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, toggleActive } = useEmployeeStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | undefined>()

  function handleAdd(name: string, role: Role) {
    addEmployee(name, role)
  }

  function handleEdit(name: string, role: Role) {
    if (editTarget) {
      updateEmployee(editTarget.id, { name, role })
      setEditTarget(undefined)
    }
  }

  function openEdit(employee: Employee) {
    setEditTarget(employee)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">직원 관리</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
            직원을 등록하고 직급을 설정합니다.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shrink-0">
          <UserPlus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">직원 </span>등록
        </Button>
      </div>

      <EmployeeList
        employees={employees}
        onEdit={openEdit}
        onToggleActive={toggleActive}
      />

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAdd}
        existingNames={employees.map((e) => e.name)}
      />

      {editTarget && (
        <EmployeeForm
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(undefined)}
          onSubmit={handleEdit}
          initialData={editTarget}
          existingNames={employees.map((e) => e.name)}
        />
      )}
    </div>
  )
}
