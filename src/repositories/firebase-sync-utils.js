const unavailableCollections = new Set()

export function canUseRemoteCollection(collectionName) {
  return !unavailableCollections.has(collectionName)
}

export function markCollectionUnavailable(collectionName, error) {
  const message = String(error?.message || '')
  const code = String(error?.code || '')
  const isMissingDatabase = message.includes("Database '(default)' not found")
  const isPermissionDenied = code.includes('permission-denied') || message.includes('Missing or insufficient permissions')

  if (!isMissingDatabase && !isPermissionDenied) {
    return false
  }

  if (!unavailableCollections.has(collectionName)) {
    if (isPermissionDenied) {
      console.warn(`Firestore access denied for ${collectionName}. Falling back to local storage.`)
    } else {
      console.warn(`Firestore is not initialized for this Firebase project. ${collectionName} will use local storage.`)
    }
  }

  unavailableCollections.add(collectionName)
  return true
}
