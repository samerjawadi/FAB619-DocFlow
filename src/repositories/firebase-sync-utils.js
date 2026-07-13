const unavailableCollections = new Map()

export function canUseRemoteCollection(collectionName) {
  const state = unavailableCollections.get(collectionName)
  if (!state) return true

  // Missing default Firestore DB is a hard failure until app/project config changes.
  if (state.reason === 'missing-database') {
    return false
  }

  // Permission issues are treated as temporary to allow automatic recovery.
  if (Date.now() < state.retryAfter) {
    return false
  }

  unavailableCollections.delete(collectionName)
  return true
}

export function markCollectionUnavailable(collectionName, error) {
  const message = String(error?.message || '')
  const code = String(error?.code || '')
  const isMissingDatabase = message.includes("Database '(default)' not found")
  const isPermissionDenied = code.includes('permission-denied') || message.includes('Missing or insufficient permissions')

  if (!isMissingDatabase && !isPermissionDenied) {
    return false
  }

  const current = unavailableCollections.get(collectionName)
  if (!current) {
    if (isPermissionDenied) {
      console.warn(`Firestore access denied for ${collectionName}. Falling back to local storage.`)
    } else {
      console.warn(`Firestore is not initialized for this Firebase project. ${collectionName} will use local storage.`)
    }
  }

  if (isMissingDatabase) {
    unavailableCollections.set(collectionName, { reason: 'missing-database', retryAfter: Number.POSITIVE_INFINITY })
  } else {
    unavailableCollections.set(collectionName, { reason: 'permission-denied', retryAfter: Date.now() + 30000 })
  }

  return true
}
