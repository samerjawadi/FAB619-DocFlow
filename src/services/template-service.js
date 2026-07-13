import { templateRepository } from '../repositories/template-repository'

export const templateService = {
  listTemplates() {
    return templateRepository.list()
  },

  saveTemplates(templates) {
    templateRepository.save(templates)
  },
}
