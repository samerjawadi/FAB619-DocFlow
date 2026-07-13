import { useLocation } from 'react-router-dom'
import { PanelLeft } from 'lucide-react'
import { navigationItems } from '../../data/navigation'
import { cn } from '../../utils/cn'
import { ThemeToggle } from '../ui/theme-toggle'
import { Button } from '../ui/button'
import { NavLink } from 'react-router-dom'

export function TopNavigation({ onToggleSidebar, isSidebarCollapsed = false }) {
  const location = useLocation()
  const activeItem = navigationItems.find((item) => item.to === location.pathname) || navigationItems[0]

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex flex-col gap-2 p-3 md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {onToggleSidebar ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <PanelLeft className="size-4" />
              </Button>
            ) : null}
            <h2 className="text-base font-semibold text-foreground">{activeItem.label}</h2>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSidebar ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <PanelLeft className="size-4" />
              </Button>
            ) : null}
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex gap-1.5 lg:hidden" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
