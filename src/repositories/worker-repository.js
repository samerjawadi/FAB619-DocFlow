import { defaultWorkers } from '../data/default-workers'
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase-client'
import { canUseRemoteCollection, markCollectionUnavailable } from './firebase-sync-utils'

const STORAGE_KEY = 'fab619-docflow-workers'
const REMOTE_COLLECTION = 'workers'

function normalizeWorker(worker) {
  return {
    id: worker.id,
    workerType: worker.workerType || 'worker',
    name: worker.name || '',
    cin: worker.cin || '',
    email: worker.email || '',
    contractType: worker.contractType || '',
    entryDate: worker.entryDate || '',
    position: worker.position || '',
    internshipPeriodFrom: worker.internshipPeriodFrom || '',
    internshipPeriodTo: worker.internshipPeriodTo || '',
    university: worker.university || '',
    branch: worker.branch || '',
    academicYear: worker.academicYear || '',
    internshipTasks: worker.internshipTasks || '',
  }
}

function toFirebaseWorker(worker) {
  return normalizeWorker(worker)
}

function listFromLocalStorage() {
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
}

function saveToLocalStorage(workers) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workers))
}

export const workerRepository = {
  async list() {
    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return listFromLocalStorage()
    }

    try {
      const snapshot = await getDocs(collection(db, REMOTE_COLLECTION))
      const workers = snapshot.docs.map((entry) => normalizeWorker({ id: entry.id, ...entry.data() }))

      if (!workers.length) {
        return defaultWorkers
      }

      saveToLocalStorage(workers)
      return workers
    } catch (error) {
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not load workers from database, using local cache.', error)
      return listFromLocalStorage()
    }
  },

  async save(workers) {
    saveToLocalStorage(workers)

    if (!isFirebaseConfigured || !db || !canUseRemoteCollection(REMOTE_COLLECTION)) {
      return
    }

    try {
      const workersCollection = collection(db, REMOTE_COLLECTION)
      const remoteSnapshot = await getDocs(workersCollection)
      const remoteIds = new Set(remoteSnapshot.docs.map((entry) => entry.id))
      const localIds = new Set(workers.map((worker) => worker.id))

      const batch = writeBatch(db)
      workers.forEach((worker) => {
        const reference = doc(db, REMOTE_COLLECTION, worker.id)
        batch.set(reference, toFirebaseWorker(worker), { merge: true })
      })

      await batch.commit()

      const idsToDelete = Array.from(remoteIds).filter((id) => !localIds.has(id))
      await Promise.all(idsToDelete.map((id) => deleteDoc(doc(db, REMOTE_COLLECTION, id))))
    } catch (error) {
      markCollectionUnavailable(REMOTE_COLLECTION, error)
      console.error('Could not save workers to database.', error)
    }
  },
}
