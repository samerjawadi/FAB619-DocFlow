import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../data/navigation'
import { cn } from '../../utils/cn'

export function Sidebar({ className, collapsed = false }) {
  const logoSrc = `${import.meta.env.BASE_URL}fab619_logo.png`

  return (
    <aside className={cn('border-r border-border/60 bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/25', className)}>
      <div className="flex h-full flex-col p-3">
        {collapsed ? (
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary dark:bg-transparent">
            <img src={logoSrc} alt="DocFlow" className="size-9 rounded-full object-contain" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-background/70 px-2.5 py-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary dark:bg-transparent">
                <img src={logoSrc} alt="DocFlow" className="size-9 rounded-full object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold tracking-tight">FAB619 - DocFlow</h1>
                <p className="text-xs text-muted-foreground">Document workspace</p>
              </div>
            </div>
          </div>
        )}

        {collapsed ? null : (
          <p className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Navigation
          </p>
        )}

        <nav className="mt-3 flex flex-col gap-1.5" aria-label="Sidebar navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    collapsed
                      ? 'mx-auto size-10 justify-center rounded-full px-0 py-0'
                      : 'gap-2.5 rounded-xl px-2.5 py-2',
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
          <div className="mt-auto rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-xs font-medium text-foreground">Productivity tip</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep templates and user profiles complete to speed up one-click document generation.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
