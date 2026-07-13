import { workerRepository } from '../repositories/worker-repository'

export const workerService = {
  async listWorkers() {
    return workerRepository.list()
  },

  async saveWorkers(workers) {
    return workerRepository.save(workers)
  },
}
