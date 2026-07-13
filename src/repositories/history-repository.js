import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase-client'
import { canUseRemoteCollection, markCollectionUnavailable } from './firebase-sync-utils'

const STORAGE_KEY = 'fab619-docflow-history-v1'
const REMOTE_COLLECTION = 'history'

function normalizeHistoryEntry(entry) {
  return {
    ...entry,
    id: entry.id,
    createdAt: entry.createdAt || new Date().toISOString(),
  }
}

function listFromLocalStorage() {
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
}

function saveToLocalStorage(entries) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const historyRepository = {
  async list() {
    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return listFromLocalStorage()
    }

    try {
      const snapshot = await getDocs(collection(db, REMOTE_COLLECTION))
      const entries = snapshot.docs
        .map((entry) => normalizeHistoryEntry({ id: entry.id, ...entry.data() }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      saveToLocalStorage(entries)
      return entries
    } catch (error) {
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not load history from database, using local cache.', error)
      return listFromLocalStorage()
    }
  },

  async save(entries) {
    saveToLocalStorage(entries)

    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return
    }

    try {
      const historyCollection = collection(db, REMOTE_COLLECTION)
      const remoteSnapshot = await getDocs(historyCollection)
      const remoteIds = new Set(remoteSnapshot.docs.map((entry) => entry.id))
      const localIds = new Set(entries.map((entry) => entry.id))

      const batch = writeBatch(db)
      entries.forEach((entry) => {
        const reference = doc(db, REMOTE_COLLECTION, entry.id)
        batch.set(reference, normalizeHistoryEntry(entry), { merge: true })
      })

      await batch.commit()

      const idsToDelete = Array.from(remoteIds).filter((id) => !localIds.has(id))
      await Promise.all(idsToDelete.map((id) => deleteDoc(doc(db, REMOTE_COLLECTION, id))))
    } catch (error) {
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not save history to database.', error)
    }
  },
}
