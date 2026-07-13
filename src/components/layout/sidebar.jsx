import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../data/navigation'
import { cn } from '../../utils/cn'

export function Sidebar({ className, collapsed = false }) {
  const logoSrc = `${import.meta.env.BASE_URL}fab619_logo.png`

  return (
    <aside className={cn('border-r border-border/60 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/20', className)}>
      <div className="flex h-full flex-col p-3">
        {collapsed ? (
          <div className="flex items-center justify-center">
            <img src={logoSrc} alt="DocFlow" className="size-10 rounded-full object-cover" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1 py-1">
            <img src={logoSrc} alt="DocFlow" className="size-10 shrink-0 rounded-full object-cover" />
            <h1 className="text-sm font-bold tracking-tight">FAB619 - DocFlow</h1>
          </div>
        )}

        <nav className="mt-5 flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center rounded-lg px-2.5 py-2 text-sm transition-colors',
                    collapsed ? 'justify-center' : 'gap-2.5',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="size-4 shrink-0" />
                {collapsed ? null : <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {collapsed ? null : (
          <p className="mt-auto px-2 text-xs text-muted-foreground/70">
            Generate documents from templates.
          </p>
        )}
      </div>
    </aside>
  )
}
