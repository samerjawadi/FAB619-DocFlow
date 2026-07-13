import { templateRepository } from '../repositories/template-repository'

export const templateService = {
  async listTemplates() {
    return templateRepository.list()
  },

  async saveTemplates(templates) {
    return templateRepository.save(templates)
  },
}
