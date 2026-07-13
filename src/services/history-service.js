import { historyRepository } from '../repositories/history-repository'

export const historyService = {
  async listEntries() {
    return historyRepository.list()
  },

  async saveEntries(entries) {
    return historyRepository.save(entries)
  },
}
