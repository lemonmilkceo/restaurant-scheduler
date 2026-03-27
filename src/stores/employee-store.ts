import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee, Role } from '@/types'

interface EmployeeState {
  employees: Employee[]
  addEmployee: (name: string, role: Role) => Employee
  updateEmployee: (id: string, updates: Partial<Pick<Employee, 'name' | 'role'>>) => void
  toggleActive: (id: string) => void
  getActiveEmployees: () => Employee[]
  getEmployee: (id: string) => Employee | undefined
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: [],

      addEmployee: (name, role) => {
        const newEmployee: Employee = {
          id: crypto.randomUUID(),
          name,
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ employees: [...state.employees, newEmployee] }))
        return newEmployee
      },

      updateEmployee: (id, updates) => {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        }))
      },

      toggleActive: (id) => {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, isActive: !e.isActive } : e,
          ),
        }))
      },

      getActiveEmployees: () => get().employees.filter((e) => e.isActive),

      getEmployee: (id) => get().employees.find((e) => e.id === id),
    }),
    { name: 'scheduler-employees' },
  ),
)
