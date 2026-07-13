import { defaultWorkers } from '../data/default-workers'

const STORAGE_KEY = 'fab619-docflow-workers'

export const workerRepository = {
  list() {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return defaultWorkers
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : defaultWorkers
    } catch {
      return defaultWorkers
    }
  },

  save(workers) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workers))
  },
}
