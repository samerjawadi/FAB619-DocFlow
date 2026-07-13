/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Link, createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AppLayout } from '../layouts/app-layout'
import { NotFoundPage } from '../pages/not-found-page'
import { SettingsPage } from '../pages/settings-page'
import { Button } from '../components/ui/button'

function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const module = await importer()
      sessionStorage.removeItem('docflow:lazy-retry')
      return module
    } catch (error) {
      const retryKey = 'docflow:lazy-retry'
      const message = error instanceof Error ? error.message : String(error)
      const isChunkLoadErrorByName = error instanceof Error && error.name === 'ChunkLoadError'
      const isChunkFetchError =
        isChunkLoadErrorByName ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        /dynamically imported module/i.test(message) ||
        /Loading chunk [\d]+ failed/i.test(message)

      let shouldRetry = false
      const previousRetryRaw = sessionStorage.getItem(retryKey)
      if (!previousRetryRaw) {
        shouldRetry = true
      } else {
        try {
          const previousRetry = JSON.parse(previousRetryRaw)
          const expired = Date.now() - Number(previousRetry.ts || 0) > 60000
          const differentPath = previousRetry.path !== window.location.pathname
          shouldRetry = expired || differentPath
        } catch {
          shouldRetry = true
        }
      }

      // GitHub Pages can serve stale index.html that references old chunk hashes.
      // Force one refresh to fetch the latest HTML/chunk map before surfacing an error.
      if (isChunkFetchError && shouldRetry) {
        sessionStorage.setItem(retryKey, JSON.stringify({ ts: Date.now(), path: window.location.pathname }))
        window.location.reload()
        return new Promise(() => {})
      }

      throw error
    }
  })
}

function RouteErrorPage() {
  const error = useRouteError()

  let title = 'Unexpected Application Error'
  let description = 'Something went wrong while loading this page.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    description = typeof error.data === 'string' ? error.data : description
  } else if (error instanceof Error) {
    description = error.message || description
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Error</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button asChild>
            <Link to="/">Go to generator</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

const GeneratePage = lazyWithRetry(() => import('../pages/generate-page').then((m) => ({ default: m.GeneratePage })))
const WorkersPage = lazyWithRetry(() => import('../pages/workers-page').then((m) => ({ default: m.WorkersPage })))
const TemplatesPage = lazyWithRetry(() => import('../pages/templates-page').then((m) => ({ default: m.TemplatesPage })))
const HistoryPage = lazyWithRetry(() => import('../pages/history-page').then((m) => ({ default: m.HistoryPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <GeneratePage />,
      },
      {
        path: 'users',
        element: <WorkersPage />,
      },
      {
        path: 'templates',
        element: <TemplatesPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    errorElement: <RouteErrorPage />,
  },
], {
  basename: import.meta.env.BASE_URL,
})
