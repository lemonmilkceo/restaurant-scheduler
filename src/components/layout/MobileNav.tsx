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
  { to: '/', icon: LayoutDashboard, label: '홈' },
  { to: '/employees', icon: Users, label: '직원' },
  { to: '/period', icon: CalendarDays, label: '기간' },
  { to: '/fixed-leave', icon: CalendarOff, label: '휴무' },
  { to: '/schedule', icon: ClipboardList, label: '스케줄' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white lg:hidden safe-bottom">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
