import { defaultTemplates } from '../data/default-templates'
import { collection, deleteDoc, doc, getDocs, query, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase-client'
import { canUseRemoteCollection, markCollectionUnavailable } from './firebase-sync-utils'

const STORAGE_KEY = 'fab619-docflow-templates-v4'
const REMOTE_COLLECTION = 'templates'

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
    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return listFromLocalStorage()
    }

    try {
      const templatesRef = query(collection(db, REMOTE_COLLECTION))
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
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not load templates from database, using local cache.', error)
      return listFromLocalStorage()
    }
  },

  async save(templates) {
    saveToLocalStorage(templates)

    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return
    }

    try {
      const templatesCollection = collection(db, REMOTE_COLLECTION)
      const remoteSnapshot = await getDocs(templatesCollection)
      const remoteIds = new Set(remoteSnapshot.docs.map((entry) => entry.id))
      const localIds = new Set(templates.map((template) => template.id))

      const batch = writeBatch(db)
      templates.forEach((template) => {
        const reference = doc(db, REMOTE_COLLECTION, template.id)
        batch.set(reference, toFirebaseTemplate(template), { merge: true })
      })

      await batch.commit()

      const idsToDelete = Array.from(remoteIds).filter((id) => !localIds.has(id))
      await Promise.all(idsToDelete.map((id) => deleteDoc(doc(db, REMOTE_COLLECTION, id))))
    } catch (error) {
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not save templates to database.', error)
    }
  },
}
