const STORAGE_KEY = 'fab619-docflow-history-v1'

export const historyRepository = {
  list() {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  save(entries) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  },
}
