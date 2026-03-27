import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PeriodConfig, FixedLeave } from '@/types'

interface PeriodState {
  periods: PeriodConfig[]
  fixedLeaves: FixedLeave[]
  currentPeriodId: string | null

  addPeriod: (startDate: string, endDate: string) => PeriodConfig
  updateStoreClosedDates: (periodId: string, dates: string[]) => void
  setCurrentPeriod: (periodId: string | null) => void
  getCurrentPeriod: () => PeriodConfig | undefined
  deletePeriod: (periodId: string) => void

  addFixedLeave: (employeeId: string, date: string) => void
  removeFixedLeave: (employeeId: string, date: string) => void
  getFixedLeavesForPeriod: (periodId: string) => FixedLeave[]
  clearFixedLeaves: () => void
}

export const usePeriodStore = create<PeriodState>()(
  persist(
    (set, get) => ({
      periods: [],
      fixedLeaves: [],
      currentPeriodId: null,

      addPeriod: (startDate, endDate) => {
        const period: PeriodConfig = {
          id: crypto.randomUUID(),
          startDate,
          endDate,
          storeClosedDates: [],
        }
        set((state) => ({
          periods: [...state.periods, period],
          currentPeriodId: period.id,
        }))
        return period
      },

      updateStoreClosedDates: (periodId, dates) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId ? { ...p, storeClosedDates: dates } : p,
          ),
        }))
      },

      setCurrentPeriod: (periodId) => set({ currentPeriodId: periodId }),

      getCurrentPeriod: () => {
        const { periods, currentPeriodId } = get()
        return periods.find((p) => p.id === currentPeriodId)
      },

      deletePeriod: (periodId) => {
        set((state) => ({
          periods: state.periods.filter((p) => p.id !== periodId),
          currentPeriodId:
            state.currentPeriodId === periodId ? null : state.currentPeriodId,
        }))
      },

      addFixedLeave: (employeeId, date) => {
        set((state) => {
          const exists = state.fixedLeaves.some(
            (fl) => fl.employeeId === employeeId && fl.date === date,
          )
          if (exists) return state
          return { fixedLeaves: [...state.fixedLeaves, { employeeId, date }] }
        })
      },

      removeFixedLeave: (employeeId, date) => {
        set((state) => ({
          fixedLeaves: state.fixedLeaves.filter(
            (fl) => !(fl.employeeId === employeeId && fl.date === date),
          ),
        }))
      },

      getFixedLeavesForPeriod: (_periodId) => {
        return get().fixedLeaves
      },

      clearFixedLeaves: () => set({ fixedLeaves: [] }),
    }),
    { name: 'scheduler-periods' },
  ),
)
