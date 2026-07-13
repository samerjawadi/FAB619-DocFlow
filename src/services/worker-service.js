import { workerRepository } from '../repositories/worker-repository'

export const workerService = {
  listWorkers() {
    return workerRepository.list()
  },

  saveWorkers(workers) {
    workerRepository.save(workers)
  },
}
