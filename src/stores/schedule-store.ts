import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Schedule, ScheduleCell } from '@/types'

interface ScheduleState {
  schedules: Schedule[]
  addSchedule: (schedule: Schedule) => void
  updateCells: (scheduleId: string, cells: ScheduleCell[]) => void
  confirmSchedule: (scheduleId: string) => void
  getScheduleForPeriod: (periodId: string) => Schedule | undefined
  deleteSchedule: (scheduleId: string) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],

      addSchedule: (schedule) => {
        set((state) => ({
          schedules: [
            ...state.schedules.filter((s) => s.periodId !== schedule.periodId),
            schedule,
          ],
        }))
      },

      updateCells: (scheduleId, cells) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId ? { ...s, cells } : s,
          ),
        }))
      },

      confirmSchedule: (scheduleId) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? { ...s, status: 'CONFIRMED' as const, confirmedAt: new Date().toISOString() }
              : s,
          ),
        }))
      },

      getScheduleForPeriod: (periodId) => {
        return get().schedules.find((s) => s.periodId === periodId)
      },

      deleteSchedule: (scheduleId) => {
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== scheduleId),
        }))
      },
    }),
    { name: 'scheduler-schedules' },
  ),
)
