import { historyRepository } from '../repositories/history-repository'

export const historyService = {
  listEntries() {
    return historyRepository.list()
  },

  saveEntries(entries) {
    historyRepository.save(entries)
  },
}
