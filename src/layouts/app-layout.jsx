import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/sidebar'
import { TopNavigation } from '../components/layout/top-navigation'
import { AppDataProvider } from '../context/app-data-context'
import { ToastProvider } from '../context/toast-context'
import { useAppData } from '../hooks/use-app-data'
import { cn } from '../utils/cn'

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-72 rounded-lg bg-muted/70" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-muted/50" />
        ))}
      </div>
    </div>
  )
}

function InitialDataSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-live="polite" aria-label="Loading data">
      <div className="h-6 w-52 rounded-lg bg-muted" />
      <div className="h-4 w-72 rounded-lg bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/60 bg-card/60" />
        ))}
      </div>
    </div>
  )
}

function AppLayoutContent({ isSidebarCollapsed, onToggleSidebar }) {
  const { isLoading } = useAppData()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div
        className={cn(
          'hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block lg:sticky lg:top-0 lg:h-screen',
          isSidebarCollapsed ? 'w-[72px]' : 'w-[220px]',
        )}
      >
        <Sidebar className="h-full w-full" collapsed={isSidebarCollapsed} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavigation onToggleSidebar={onToggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 lg:p-6">
          {isLoading ? (
            <InitialDataSkeleton />
          ) : (
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <AppDataProvider>
      <ToastProvider>
        <AppLayoutContent
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((previous) => !previous)}
        />
      </ToastProvider>
    </AppDataProvider>
  )
}
