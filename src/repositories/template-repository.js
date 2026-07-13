import { defaultTemplates } from '../data/default-templates'

const STORAGE_KEY = 'fab619-docflow-templates-v4'

export const templateRepository = {
  list() {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return defaultTemplates
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : defaultTemplates
    } catch {
      return defaultTemplates
    }
  },

  save(templates) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  },
}
