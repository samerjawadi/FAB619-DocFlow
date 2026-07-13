import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerLicense } from '@syncfusion/ej2-base'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import { ThemeProvider } from './context/theme-context'
import { router } from './router'
import './index.css'

registerLicense('Ngo9BigBOggjHTQxAR8/V1JAaF5cX2pCd1p/TH5YfUNzdUVEY1ZUTXxaS1ZhSXxVdkJjUH9XdXRUT2lZWEB9XEY=')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)

function logVital({ name, value, rating }) {
  console.info(`[web-vitals] ${name}: ${Math.round(value)} (${rating})`)
}
onCLS(logVital)
onFCP(logVital)
onINP(logVital)
onLCP(logVital)
onTTFB(logVital)
