import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import EmployeesPage from '@/pages/EmployeesPage'
import PeriodSetupPage from '@/pages/PeriodSetupPage'
import FixedLeavePage from '@/pages/FixedLeavePage'
import SchedulePage from '@/pages/SchedulePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="period" element={<PeriodSetupPage />} />
          <Route path="fixed-leave" element={<FixedLeavePage />} />
          <Route path="schedule" element={<SchedulePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
