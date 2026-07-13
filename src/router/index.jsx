/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/app-layout'
import { WorkersPage } from '../pages/workers-page'
import { NotFoundPage } from '../pages/not-found-page'

const GeneratePage  = lazy(() => import('../pages/generate-page').then((m) => ({ default: m.GeneratePage })))
const TemplatesPage = lazy(() => import('../pages/templates-page').then((m) => ({ default: m.TemplatesPage })))
const HistoryPage   = lazy(() => import('../pages/history-page').then((m) => ({ default: m.HistoryPage })))
const SettingsPage  = lazy(() => import('../pages/settings-page').then((m) => ({ default: m.SettingsPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
  },
], {
  basename: import.meta.env.BASE_URL,
})
