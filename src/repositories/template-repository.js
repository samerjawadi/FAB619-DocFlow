import { defaultTemplates } from '../data/default-templates'
import { collection, deleteDoc, doc, getDocs, query, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase-client'

const STORAGE_KEY = 'fab619-docflow-templates-v4'
let isFirestoreUnavailable = false

function markFirestoreUnavailable(error) {
  const message = String(error?.message || '')
  const code = String(error?.code || '')
  const isMissingDatabase = message.includes("Database '(default)' not found")
  const isPermissionDenied = code.includes('permission-denied') || message.includes('Missing or insufficient permissions')

  if (!isMissingDatabase && !isPermissionDenied) {
    return
  }

  if (!isFirestoreUnavailable) {
    if (isPermissionDenied) {
      console.warn('Firestore access denied by security rules. Falling back to local storage.')
    } else {
      console.warn('Firestore is not initialized for this Firebase project. Falling back to local storage.')
    }
  }
  isFirestoreUnavailable = true
}

function listFromLocalStorage() {
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
}

function saveToLocalStorage(templates) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function normalizeTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    createdAt: template.createdAt || new Date().toISOString(),
    format: template.format || 'sfdt',
    sfdt: template.sfdt || '',
    content: template.content || '',
  }
}

function toFirebaseTemplate(template) {
  return {
    name: template.name,
    description: template.description || '',
    createdAt: template.createdAt || new Date().toISOString(),
    format: template.format || 'sfdt',
    sfdt: template.sfdt || '',
    content: template.content || '',
  }
}

export const templateRepository = {
  async list() {
    if (!isFirebaseConfigured || !db || isFirestoreUnavailable) {
      return listFromLocalStorage()
    }

    try {
      const templatesRef = query(collection(db, 'templates'))
      const snapshot = await getDocs(templatesRef)
      const templates = snapshot.docs
        .map((entry) => normalizeTemplate({ id: entry.id, ...entry.data() }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      if (!templates.length) {
        return defaultTemplates
      }

      saveToLocalStorage(templates)
      return templates
    } catch (error) {
      markFirestoreUnavailable(error)
      console.error('Could not load templates from database, using local cache.', error)
      return listFromLocalStorage()
    }
  },

  async save(templates) {
    saveToLocalStorage(templates)

    if (!isFirebaseConfigured || !db || isFirestoreUnavailable) {
      return
    }

    try {
      const templatesCollection = collection(db, 'templates')
      const remoteSnapshot = await getDocs(templatesCollection)
      const remoteIds = new Set(remoteSnapshot.docs.map((entry) => entry.id))
      const localIds = new Set(templates.map((template) => template.id))

      const batch = writeBatch(db)
      templates.forEach((template) => {
        const reference = doc(db, 'templates', template.id)
        batch.set(reference, toFirebaseTemplate(template), { merge: true })
      })

      await batch.commit()

      const idsToDelete = Array.from(remoteIds).filter((id) => !localIds.has(id))
      await Promise.all(idsToDelete.map((id) => deleteDoc(doc(db, 'templates', id))))
    } catch (error) {
      markFirestoreUnavailable(error)
      console.error('Could not save templates to database.', error)
    }
  },
}
