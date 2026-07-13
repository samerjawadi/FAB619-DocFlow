import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DocumentEditorContainerComponent, Toolbar as DocumentEditorToolbar } from '@syncfusion/ej2-react-documenteditor'
import { Copy, Files, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useAppData } from '../hooks/use-app-data'
import { useToast } from '../context/toast-context'
import { useDebounce } from '../hooks/use-debounce'
import { cn } from '../utils/cn'

if (!globalThis.__docflowToolbarInjected) {
  DocumentEditorContainerComponent.Inject(DocumentEditorToolbar)
  globalThis.__docflowToolbarInjected = true
}

const DOC_EDITOR_SERVICE_URL = 'https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/'

const templateDefaults = { name: '', description: '' }

const PLACEHOLDER_GROUPS = [
  {
    label: 'Personal',
    keys: ['name', 'cin', 'email'],
  },
  {
    label: 'Contract',
    keys: ['contractType', 'entryDate', 'position'],
  },
  {
    label: 'Internship',
    keys: ['internshipPeriodFrom', 'internshipPeriodTo', 'university', 'branch', 'academicYear', 'internshipTasks'],
  },
  {
    label: 'System',
    keys: ['todayDate'],
  },
  {
    label: 'Document',
    keys: ['STAMP'],
  },
]

export function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, restoreTemplate } = useAppData()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isEditorLoading, setIsEditorLoading] = useState(false)
  const [isImportingDocx, setIsImportingDocx] = useState(false)
  const [importStatus, setImportStatus] = useState('info')
  const [importMessage, setImportMessage] = useState('')
  const [editorReady, setEditorReady] = useState(false)
  const wordEditorRef = useRef(null)
  const docxInputRef = useRef(null)
  const pendingSfdtRef = useRef(null)
  const deletedTemplateRef = useRef(null)

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm({ defaultValues: templateDefaults })

  const editingTemplate = useMemo(
    () => templates.find((t) => t.id === editingId) || null,
    [templates, editingId],
  )

  const filteredTemplates = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => `${t.name} ${t.description || ''}`.toLowerCase().includes(q))
  }, [templates, debouncedSearch])

  useEffect(() => {
    if (!editingId || !editorReady || !wordEditorRef.current?.documentEditor) return
    const editor = wordEditorRef.current.documentEditor
    setIsEditorLoading(true)
    let loadError = ''
    try {
      editor.isReadOnly = false
      if (editingTemplate?.format === 'sfdt' && editingTemplate.sfdt) {
        editor.open(editingTemplate.sfdt)
      } else if (pendingSfdtRef.current) {
        editor.open(pendingSfdtRef.current)
        pendingSfdtRef.current = null
      } else {
        editor.openBlank()
      }
    } catch {
      loadError = 'Could not load this document in the editor.'
    } finally {
      setIsEditorLoading(false)
    }
    setImportMessage(loadError)
  }, [editingId, editingTemplate, editorReady])

  const duplicateAndEdit = (template) => {
    setIsEditorLoading(false)
    setImportMessage('')
    setImportStatus('info')
    pendingSfdtRef.current = template.sfdt || null
    setEditingId('new')
    reset({ name: `${template.name} (copy)`, description: template.description || '' })
  }

  const openCreate = () => {
    setIsEditorLoading(false)
    setImportMessage('')
    setImportStatus('info')
    pendingSfdtRef.current = null
    setEditingId('new')
    reset({ name: 'Untitled Template', description: 'Custom document template' })
  }

  const startEdit = (template) => {
    setIsEditorLoading(false)
    setImportMessage('')
    setImportStatus('info')
    setEditingId(template.id)
    reset({ name: template.name || '', description: template.description || '' })
    if (template.format !== 'sfdt' || !template.sfdt) {
      setImportStatus('error')
      setImportMessage('This template uses an older format. Save to upgrade it.')
    }
  }

  const cancelEdit = useCallback(() => {
    setEditorReady(false)
    setEditingId('')
    setImportMessage('')
    setImportStatus('info')
    setIsEditorLoading(false)
    reset(templateDefaults)
  }, [reset])

  const onSubmit = useCallback((values) => {
    const editor = wordEditorRef.current?.documentEditor
    if (!editor) {
      setImportStatus('error')
      setImportMessage('Editor is not ready. Please try again.')
      return
    }
    if (isEditorLoading) {
      setImportStatus('error')
      setImportMessage('Please wait for the document to finish loading.')
      return
    }
    try {
      const sfdt = editor.serialize()
      const payload = { name: values.name, description: values.description, format: 'sfdt', sfdt, content: '' }
      if (editingTemplate) {
        updateTemplate(editingTemplate.id, payload)
        toast({ message: `"${values.name}" updated successfully.`, variant: 'success' })
      } else {
        addTemplate(payload)
        toast({ message: `"${values.name}" saved successfully.`, variant: 'success' })
      }
      cancelEdit()
    } catch {
      setImportStatus('error')
      setImportMessage('Could not save this template. Please try again.')
      toast({ message: 'Could not save this template. Please try again.', variant: 'destructive' })
    }
  }, [wordEditorRef, isEditorLoading, editingTemplate, updateTemplate, addTemplate, cancelEdit, toast])

  const handleFormSubmit = useCallback((e) => handleSubmit(onSubmit)(e), [handleSubmit, onSubmit])

  const triggerDocxImport = () => {
    docxInputRef.current?.click()
  }

  const handleDocxImport = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const editor = wordEditorRef.current?.documentEditor
    if (!editor) {
      setImportStatus('error')
      setImportMessage('Editor is not ready. Please try again.')
      return
    }

    setImportMessage('')
    setIsEditorLoading(true)
    setIsImportingDocx(true)

    try {
      editor.isReadOnly = false
      if (typeof editor.openAsync === 'function') {
        await editor.openAsync(file)
      } else {
        editor.open(file)
      }

      if (!editingTemplate) {
        const currentName = (getValues('name') || '').trim()
        if (!currentName || currentName === 'Untitled Template') {
          const inferredName = file.name.replace(/\.[^.]+$/, '').trim()
          if (inferredName) {
            setValue('name', inferredName)
          }
        }
      }

      setImportStatus('success')
      setImportMessage(`Loaded ${file.name}. You can edit it and save as a template.`)
      toast({ message: `Loaded ${file.name} successfully.`, variant: 'success' })
    } catch {
      setImportStatus('error')
      setImportMessage('Could not import this DOCX file. Please choose a valid .docx document.')
      toast({ message: 'DOCX import failed. Please try another file.', variant: 'destructive' })
    } finally {
      setIsEditorLoading(false)
      setIsImportingDocx(false)
    }
  }, [editingTemplate, getValues, setValue, toast])

  const confirmDelete = () => {
    if (!pendingDelete) return
    const templateToDelete = pendingDelete
    deletedTemplateRef.current = templateToDelete
    deleteTemplate(templateToDelete.id)
    if (editingId === templateToDelete.id) cancelEdit()
    setPendingDelete(null)

    toast({
      message: `"${templateToDelete.name}" deleted.`,
      action: {
        label: 'Undo',
        onClick: () => restoreTemplate(deletedTemplateRef.current),
      },
      duration: 6000,
    })
  }

  const insertPlaceholder = (key) => {
    const editor = wordEditorRef.current?.documentEditor
    if (!editor?.editor) return
    editor.focusIn()
    editor.editor.insertText(`{{${key}}}`)
  }

  return (
    <section className="space-y-6 animate-fade-in" aria-labelledby="templates-title">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Template workspace
            </div>
            <h1 id="templates-title" className="text-xl font-semibold tracking-tight">Templates</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Build reusable document templates with placeholder controls and DOCX-native editing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New template
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_250px]">
        {/* Template list */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Manage your document templates.</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openCreate} className="xl:hidden">
                <Plus className="size-4" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates"
                className="pl-9"
                aria-label="Search templates"
              />
            </div>

            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    'rounded-lg border p-3',
                    editingId === template.id ? 'border-primary bg-primary/10' : 'border-border/70 bg-card',
                  )}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description || 'No description'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(template)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => duplicateAndEdit(template)}>
                      <Copy className="size-3.5" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      onClick={() => setPendingDelete(template)}
                      aria-label={`Delete ${template.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {!filteredTemplates.length && (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/25 p-4 text-center">
                  {templates.length === 0 ? (
                    <>
                      <Files className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium">No templates yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "New" to create one.</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No templates match your search.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor area */}
        <div className="min-w-0">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Edit template' : editingId === 'new' ? 'Create template' : 'Template editor'}
              </CardTitle>
              {!editingId && (
                <CardDescription>Select a template from the list or click "New" to start editing.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {editingId ? (
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                  {/* Name + Description row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template name</Label>
                      <Input id="name" {...register('name', { required: 'Template name is required.' })} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" {...register('description')} />
                    </div>
                  </div>

                  {/* Save / Cancel — top for quick access */}
                  <div className="flex justify-end gap-2">
                    <input
                      ref={docxInputRef}
                      type="file"
                      accept=".docx"
                      onChange={handleDocxImport}
                      className="hidden"
                      aria-label="Import DOCX template"
                    />
                    <Button type="button" variant="outline" onClick={triggerDocxImport} disabled={isEditorLoading || isImportingDocx}>
                      <Upload className="size-4" />
                      {isImportingDocx ? 'Importing…' : 'Import DOCX'}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isEditorLoading}>
                      {isEditorLoading ? 'Loading…' : editingTemplate ? 'Update template' : 'Save template'}
                    </Button>
                  </div>

                  {/* Editor + right placeholder panel */}
                  <div className="grid gap-4 xl:grid-cols-[1fr_196px]">
                    {/* Document editor */}
                    <div className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card">
                      <DocumentEditorContainerComponent
                        ref={wordEditorRef}
                        id="template-word-editor"
                        width="100%"
                        height="760px"
                        enableToolbar
                        serviceUrl={DOC_EDITOR_SERVICE_URL}
                        enableSpellCheck={false}
                        created={() => setEditorReady(true)}
                      />
                    </div>

                    {/* Sticky placeholder sidebar */}
                    <div className="self-start xl:sticky xl:top-20 space-y-4 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Variables
                      </p>
                      {PLACEHOLDER_GROUPS.map((group) => (
                        <div key={group.label} className="space-y-1.5">
                          <p className="text-[11px] font-medium text-muted-foreground">{group.label}</p>
                          <div className="flex flex-col gap-1">
                            {group.keys.map((key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => insertPlaceholder(key)}
                                className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-left text-[11px] font-mono text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
                              >
                                {`{{${key}}}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {importMessage && (
                    <p
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm',
                        importStatus === 'success'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'border-warning/40 bg-warning/10 text-warning-foreground',
                      )}
                    >
                      {importMessage}
                    </p>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/25 py-12 text-center">
                  <Files className="size-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No template selected</p>
                  <p className="text-xs text-muted-foreground">Choose a template to edit or click "New" to create one.</p>
                  <Button type="button" size="sm" onClick={openCreate} className="mt-1">
                    <Plus className="size-4" />
                    New template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Template Health</CardTitle>
              <CardDescription>Maintain reusable and reliable template content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-foreground">Total templates</span>
                <strong>{templates.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-foreground">Visible results</span>
                <strong>{filteredTemplates.length}</strong>
              </div>
              <p className="inline-flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" />
                Add clear descriptions and keep placeholders standardized for faster generation and fewer review errors.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Delete confirmation */}
      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Delete template?
            </DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{pendingDelete?.name}</strong> will be permanently removed.
              You can undo this for a few seconds after deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
