import { useState } from 'react'
import type { Role, Employee } from '@/types'
import { ROLE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, role: Role) => void
  initialData?: Employee
  existingNames?: string[]
}

export function EmployeeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  existingNames = [],
}: EmployeeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [role, setRole] = useState<Role>(initialData?.role ?? 'STAFF')
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const isEdit = !!initialData
  const trimmedName = name.trim()
  const isValid = trimmedName.length > 0 && trimmedName.length <= 20

  function handleSubmit() {
    if (!isValid) return

    const isDuplicate = existingNames.some(
      (n) => n === trimmedName && (!initialData || initialData.name !== trimmedName),
    )

    if (isDuplicate && !showDuplicateWarning) {
      setShowDuplicateWarning(true)
      return
    }

    onSubmit(trimmedName, role)
    resetAndClose()
  }

  function resetAndClose() {
    setName(initialData?.name ?? '')
    setRole(initialData?.role ?? 'STAFF')
    setShowDuplicateWarning(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent onClose={resetAndClose}>
        <DialogHeader>
          <DialogTitle>{isEdit ? '직원 수정' : '직원 등록'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">이름 *</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setShowDuplicateWarning(false)
              }}
              placeholder="이름 입력"
              maxLength={20}
              autoFocus
            />
            {showDuplicateWarning && (
              <p className="text-sm text-amber-600">
                동일 이름의 직원이 있습니다. 한 번 더 누르면 등록됩니다.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">직급 *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
              <option value="ASSISTANT_MANAGER">{ROLE_LABELS.ASSISTANT_MANAGER}</option>
              <option value="STAFF">{ROLE_LABELS.STAFF}</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isEdit ? '수정' : showDuplicateWarning ? '그래도 등록' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
