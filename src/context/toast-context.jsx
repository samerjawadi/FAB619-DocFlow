import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { cn } from '../utils/cn'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ message, action, duration = 5000, variant = 'default' }) => {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString())
      setToasts((prev) => [...prev, { id, message, action, variant }])
      timersRef.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex min-w-72 max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-fade-in',
              t.variant === 'destructive' && 'border-destructive/30 bg-destructive/5',
              t.variant === 'success' && 'border-emerald-300 bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/30',
            )}
          >
            <p
              className={cn(
                'text-sm text-foreground',
                t.variant === 'destructive' && 'text-destructive',
                t.variant === 'success' && 'text-emerald-800 dark:text-emerald-300',
              )}
            >
              {t.message}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {t.action && (
                <button
                  type="button"
                  onClick={() => { t.action.onClick(); dismiss(t.id) }}
                  className="text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
