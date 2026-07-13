import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { templateService } from '../services/template-service'
import { workerService } from '../services/worker-service'
import { historyService } from '../services/history-service'

const AppDataContext = createContext(null)

function createId(prefix) {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  return `${prefix}-${uuid}`
}

export function AppDataProvider({ children }) {
  const [workers, setWorkers] = useState([])
  const [workersHydrated, setWorkersHydrated] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templatesHydrated, setTemplatesHydrated] = useState(false)
  const [history, setHistory] = useState([])
  const [historyHydrated, setHistoryHydrated] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      const [workersResult, templatesResult, historyResult] = await Promise.allSettled([
        workerService.listWorkers(),
        templateService.listTemplates(),
        historyService.listEntries(),
      ])

      if (!isMounted) return

      if (workersResult.status === 'fulfilled') {
        setWorkers(workersResult.value)
      } else {
        console.error('Could not load workers.', workersResult.reason)
      }

      if (templatesResult.status === 'fulfilled') {
        setTemplates(templatesResult.value)
      } else {
        console.error('Could not load templates.', templatesResult.reason)
      }

      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value)
      } else {
        console.error('Could not load history.', historyResult.reason)
      }

      setWorkersHydrated(true)
      setTemplatesHydrated(true)
      setHistoryHydrated(true)
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!workersHydrated) return
    workerService.saveWorkers(workers).catch((error) => {
      console.error('Could not persist workers.', error)
    })
  }, [workers, workersHydrated])

  useEffect(() => {
    if (!templatesHydrated) return
    templateService.saveTemplates(templates).catch((error) => {
      console.error('Could not persist templates.', error)
    })
  }, [templates, templatesHydrated])

  useEffect(() => {
    if (!historyHydrated) return
    historyService.saveEntries(history).catch((error) => {
      console.error('Could not persist history.', error)
    })
  }, [history, historyHydrated])

  const isWorkersLoading = !workersHydrated
  const isTemplatesLoading = !templatesHydrated
  const isHistoryLoading = !historyHydrated
  const isLoading = isWorkersLoading || isTemplatesLoading || isHistoryLoading

  const value = useMemo(
    () => ({
      workers,
      templates,
      history,
      isWorkersLoading,
      isTemplatesLoading,
      isHistoryLoading,
      isLoading,
      addWorker(payload) {
        setWorkers((previous) => [...previous, { id: createId('w'), ...payload }])
      },
      addWorkersIfMissing(payloads) {
        setWorkers((previous) => {
          const keys = new Set(previous.map((worker) => `${worker.name}::${worker.cin}`.toLowerCase()))
          const itemsToAdd = payloads
            .filter((payload) => !keys.has(`${payload.name}::${payload.cin}`.toLowerCase()))
            .map((payload) => ({ id: createId('w'), ...payload }))

          return itemsToAdd.length ? [...previous, ...itemsToAdd] : previous
        })
      },
      updateWorker(id, payload) {
        setWorkers((previous) => previous.map((worker) => (worker.id === id ? { ...worker, ...payload } : worker)))
      },
      deleteWorker(id) {
        setWorkers((previous) => previous.filter((worker) => worker.id !== id))
      },
      restoreWorker(worker) {
        setWorkers((previous) => previous.some((w) => w.id === worker.id) ? previous : [worker, ...previous])
      },
      addTemplate(payload) {
        setTemplates((previous) => [...previous, { id: createId('t'), createdAt: new Date().toISOString(), ...payload }])
      },
      updateTemplate(id, payload) {
        setTemplates((previous) => previous.map((template) => (template.id === id ? { ...template, ...payload } : template)))
      },
      deleteTemplate(id) {
        setTemplates((previous) => previous.filter((template) => template.id !== id))
      },
      restoreTemplate(template) {
        setTemplates((previous) => previous.some((t) => t.id === template.id) ? previous : [template, ...previous])
      },
      duplicateTemplate(id) {
        setTemplates((previous) => {
          const source = previous.find((t) => t.id === id)
          if (!source) return previous
          const copy = {
            ...source,
            id: createId('t'),
            name: `${source.name} (copy)`,
            createdAt: new Date().toISOString(),
          }
          const idx = previous.findIndex((t) => t.id === id)
          const next = [...previous]
          next.splice(idx + 1, 0, copy)
          return next
        })
      },
      upsertHistoryEntry(payload) {
        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        setHistory((previous) => {
          const idx = previous.findIndex(
            (entry) =>
              entry.templateId === payload.templateId &&
              entry.workerId === payload.workerId &&
              entry.createdAt.slice(0, 10) === today,
          )
          const updated = { id: createId('h'), createdAt: new Date().toISOString(), ...payload }
          if (idx !== -1) {
            const next = [...previous]
            next[idx] = updated
            return next
          }
          return [updated, ...previous]
        })
      },
      updateHistoryEntry(id, payload) {
        setHistory((previous) => previous.map((entry) => (entry.id === id ? { ...entry, ...payload } : entry)))
      },
      deleteHistoryEntry(id) {
        setHistory((previous) => previous.filter((entry) => entry.id !== id))
      },
    }),
    [workers, templates, history, isWorkersLoading, isTemplatesLoading, isHistoryLoading, isLoading],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppDataContext() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider')
  }

  return context
}
