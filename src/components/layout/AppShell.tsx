import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
