import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarOff,
  ClipboardList,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/employees', icon: Users, label: '직원 관리' },
  { to: '/period', icon: CalendarDays, label: '기간 설정' },
  { to: '/fixed-leave', icon: CalendarOff, label: '고정 휴무' },
  { to: '/schedule', icon: ClipboardList, label: '스케줄' },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <CalendarDays className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">스케줄러</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
