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
              'pointer-events-auto flex min-w-72 max-w-md items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-xl ring-1 ring-black/10 animate-fade-in',
              t.variant === 'default' && 'border-slate-800 bg-slate-900 text-slate-100 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900',
              t.variant === 'destructive' && 'border-red-700 bg-red-700 text-white',
              t.variant === 'success' && 'border-emerald-700 bg-emerald-700 text-white',
            )}
          >
            <p
              className={cn(
                'text-sm font-medium',
                t.variant === 'default' && 'text-inherit',
                t.variant === 'destructive' && 'text-white',
                t.variant === 'success' && 'text-white',
              )}
            >
              {t.message}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {t.action && (
                <button
                  type="button"
                  onClick={() => { t.action.onClick(); dismiss(t.id) }}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-sm font-semibold underline-offset-2 focus:outline-none focus:ring-2',
                    t.variant === 'default' && 'text-inherit hover:underline focus:ring-slate-400 dark:focus:ring-slate-500',
                    t.variant === 'destructive' && 'text-white hover:underline focus:ring-red-300',
                    t.variant === 'success' && 'text-white hover:underline focus:ring-emerald-300',
                  )}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className={cn(
                  'rounded-sm p-0.5 transition-colors focus:outline-none focus:ring-2',
                  t.variant === 'default' && 'text-inherit/80 hover:text-inherit focus:ring-slate-400 dark:focus:ring-slate-500',
                  t.variant === 'destructive' && 'text-white/85 hover:text-white focus:ring-red-300',
                  t.variant === 'success' && 'text-white/85 hover:text-white focus:ring-emerald-300',
                )}
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
