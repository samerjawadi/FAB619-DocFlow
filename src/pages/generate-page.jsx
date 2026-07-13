import { useEffect, useMemo, useRef, useState } from 'react'
import { DocumentEditorContainerComponent, Toolbar as DocumentEditorToolbar } from '@syncfusion/ej2-react-documenteditor'
import { BookmarkCheck, CheckCircle2, Files, PanelRightClose, PanelRightOpen, Printer, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useAppData } from '../hooks/use-app-data'
import { useDebounce } from '../hooks/use-debounce'
import { useSettings } from '../hooks/use-settings'
import { useToast } from '../context/toast-context'
import { renderTemplate } from '../utils/render-template'
import { cn } from '../utils/cn'

if (!globalThis.__docflowToolbarInjected) {
  DocumentEditorContainerComponent.Inject(DocumentEditorToolbar)
  globalThis.__docflowToolbarInjected = true
}

const DOC_EDITOR_SERVICE_URL = 'https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/'

const emptyFormValues = {
  name: '',
  cin: '',
  contractType: '',
  entryDate: '',
  position: '',
  internshipPeriodFrom: '',
  internshipPeriodTo: '',
  university: '',
  branch: '',
  academicYear: '',
  internshipTasks: '',
}

const HIDDEN_PLACEHOLDER_STYLE = 'color:#ffffff;opacity:1;'

function buildDocumentHtml(content, title) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #111827; line-height: 1.6; margin: 0; }
    .page { max-width: 794px; margin: 0 auto; padding: 40px; box-sizing: border-box; }
    table { border-collapse: collapse; width: 100%; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="page">${content}</div>
</body>
</html>`
}

function hasTemplatePlaceholder(content, key) {
  if (!content) return false
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'i')
  return regex.test(content)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyValuesToSfdt(sfdt, values) {
  let result = sfdt
  for (const [key, rawValue] of Object.entries(values)) {
    const replacement = rawValue === undefined || rawValue === null ? '' : String(rawValue)
    const tokenRegex = new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, 'g')
    result = result.replace(tokenRegex, replacement)
  }
  return result
}

async function replaceDocxPlaceholderWithImage(editor, key, imageData, imageSize = { width: 140, height: 80 }) {
  if (!editor?.search || !editor?.editor) return false

  const variants = [
    `{{${key}}}`,
    `{{ ${key} }}`,
    `{{${key.toLowerCase()}}}`,
    `{{ ${key.toLowerCase()} }}`,
  ]

  let replaced = false

  for (const token of variants) {
    editor.search.findAll(token)
    const matches = editor.search.searchResults?.length || 0
    if (!matches) continue

    for (let i = 0; i < matches; i += 1) {
      editor.search.searchResults.index = 0
      editor.search.searchResults.navigate()
      // Clear placeholder text first, then insert image in the same location.
      editor.editor.insertText('')
      if (imageData) {
        if (typeof editor.editor.insertImageAsync === 'function') {
          await editor.editor.insertImageAsync(imageData, imageSize.width, imageSize.height, key)
        } else {
          editor.editor.insertImage(imageData, imageSize.width, imageSize.height, key)
        }
      }
      replaced = true
    }
    editor.search.searchResults?.clear?.()
    break
  }

  return replaced
}

function fitDocxPreview(editor) {
  if (!editor) return
  if (typeof editor.fitPage === 'function') editor.fitPage('FitPageWidth')
  if (typeof editor.zoomFactor === 'number' && editor.zoomFactor > 1) editor.zoomFactor = 1
}

function StepItem({ number, done, label, sublabel }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-2 min-w-0">
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
          done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {done ? <CheckCircle2 className="size-4" /> : number}
      </div>
      <div className="text-center min-w-0">
        <p className="text-xs font-medium leading-none">{label}</p>
        {sublabel && (
          <p className="mt-0.5 max-w-[100px] truncate text-[11px] text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  )
}

function OptionSwitch({ title, description, checked, disabled, onToggle }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        checked ? 'border-primary/50 bg-primary/5' : 'border-border/70 bg-card',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 pr-2">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`Toggle ${title}`}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            checked ? 'bg-primary' : 'bg-muted',
            disabled && 'cursor-not-allowed',
          )}
        >
          <span
            className={cn(
              'inline-block size-5 transform rounded-full bg-background shadow-sm transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  )
}

export function GeneratePage() {
  const { templates, workers, upsertHistoryEntry } = useAppData()
  const { toast } = useToast()
  const [templateId, setTemplateId] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [workerQuery, setWorkerQuery] = useState('')
  const debouncedTemplateQuery = useDebounce(templateQuery, 250)
  const debouncedWorkerQuery = useDebounce(workerQuery, 250)
  const [formValues, setFormValues] = useState(emptyFormValues)
  const [exportMessage, setExportMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSetupPanelCollapsed, setIsSetupPanelCollapsed] = useState(false)
  const isPreviewEditable = true
  const [manualPreviewHtml, setManualPreviewHtml] = useState('')
  const [docxEditorReady, setDocxEditorReady] = useState(false)
  const docxPreviewRef = useRef(null)
  const previewViewportRef = useRef(null)

  const { stampImage, stampWidth, stampHeight } = useSettings()
  const [applyStamp, setApplyStamp] = useState(true)

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId],
  )

  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === workerId) || null,
    [workers, workerId],
  )

  const selectedWorkerType = selectedWorker?.workerType || null
  const isDocxTemplate = Boolean(selectedTemplate?.format === 'sfdt' && selectedTemplate?.sfdt)
  const templateSource = isDocxTemplate ? selectedTemplate?.sfdt ?? '' : selectedTemplate?.content ?? ''

  const hasStampPlaceholder = useMemo(
    () => hasTemplatePlaceholder(templateSource, 'STAMP'),
    [templateSource],
  )

  const shouldApplyStamp = Boolean(stampImage) && applyStamp
  const effectiveStampWidth = Number.isFinite(stampWidth) && stampWidth > 0 ? stampWidth : 140
  const effectiveStampHeight = Number.isFinite(stampHeight) && stampHeight > 0 ? stampHeight : 80

  const templateValues = useMemo(() => ({
    ...formValues,
    todayDate: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
    STAMP: !isDocxTemplate
      ? (shouldApplyStamp && stampImage
        ? `<img src="${stampImage}" style="width:${effectiveStampWidth}px;height:${effectiveStampHeight}px;object-fit:contain;display:inline-block;" alt="Stamp" />`
        : hasStampPlaceholder
          ? `<span style="${HIDDEN_PLACEHOLDER_STYLE}">STAMP</span>`
          : '')
      : '',
  }), [
    formValues,
    shouldApplyStamp,
    stampImage,
    isDocxTemplate,
    hasStampPlaceholder,
    effectiveStampWidth,
    effectiveStampHeight,
  ])

  const previewHtml = useMemo(
    () => renderTemplate(selectedTemplate?.content ?? '', templateValues),
    [selectedTemplate, templateValues],
  )

  const finalHtml = useMemo(() => {
    const base = manualPreviewHtml || previewHtml
    if (isDocxTemplate || !base) return base
    const content = selectedTemplate?.content || ''
    const appendParts = []
    if (shouldApplyStamp && stampImage && !hasTemplatePlaceholder(content, 'STAMP'))
      appendParts.push(`<img src="${stampImage}" style="width:${effectiveStampWidth}px;height:${effectiveStampHeight}px;object-fit:contain;display:inline-block;" alt="Stamp" />`)
    if (!appendParts.length) return base
    return `${base}<div style="margin-top:40px;display:flex;justify-content:flex-end;gap:16px;align-items:flex-end;">${appendParts.join('')}</div>`
  }, [
    manualPreviewHtml,
    previewHtml,
    shouldApplyStamp,
    isDocxTemplate,
    selectedTemplate,
    stampImage,
    effectiveStampWidth,
    effectiveStampHeight,
  ])

  useEffect(() => {
    if (!isDocxTemplate || !docxEditorReady || !docxPreviewRef.current?.documentEditor || !selectedTemplate?.sfdt) return
    let isCancelled = false
    const editor = docxPreviewRef.current.documentEditor
    let errorMessage = ''
    const loadPreview = async () => {
      try {
        const sfdtValues = { ...templateValues }
        // When option is OFF, remove placeholder text directly in SFDT replacement.
        // When option is ON, keep placeholders so we can replace them with images.
        if (shouldApplyStamp) delete sfdtValues.STAMP

        const processedSfdt = applyValuesToSfdt(selectedTemplate.sfdt, sfdtValues)
        editor.isReadOnly = false
        editor.open(processedSfdt)

        if (shouldApplyStamp && hasStampPlaceholder) {
          await replaceDocxPlaceholderWithImage(
            editor,
            'STAMP',
            stampImage,
            { width: effectiveStampWidth, height: effectiveStampHeight },
          )
        }

        const container = docxPreviewRef.current
        if (typeof container?.showPropertiesPane === 'function') container.showPropertiesPane(false)
        if (typeof editor.showOptionsPane === 'function') editor.showOptionsPane(false)
        if (typeof editor.showRestrictEditingPane === 'function') editor.showRestrictEditingPane(false)
        if (!isCancelled) {
          editor.isReadOnly = !isPreviewEditable
          fitDocxPreview(editor)
        }
      } catch {
        errorMessage = 'Could not render DOCX preview. You can still try downloading the document.'
      }
      if (!isCancelled) setExportMessage(errorMessage)
    }

    loadPreview()
    return () => { isCancelled = true }
  }, [
    isDocxTemplate,
    selectedTemplate,
    templateValues,
    docxEditorReady,
    isPreviewEditable,
    shouldApplyStamp,
    hasStampPlaceholder,
    stampImage,
    effectiveStampWidth,
    effectiveStampHeight,
  ])

  useEffect(() => {
    const editor = docxPreviewRef.current?.documentEditor
    if (!editor) return
    if (typeof editor.showOptionsPane === 'function') editor.showOptionsPane(false)
    if (typeof editor.showRestrictEditingPane === 'function') editor.showRestrictEditingPane(false)
  }, [isPreviewEditable])

  useEffect(() => {
    if (!isDocxTemplate || !docxEditorReady) return
    const previewContainer = docxPreviewRef.current
    const editor = previewContainer?.documentEditor
    const viewport = previewViewportRef.current
    if (!editor || !viewport) return
    let frameId = 0
    const reflowPreview = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (previewContainer?.element?.style) {
          previewContainer.element.style.width = '100%'
          previewContainer.element.style.maxWidth = '100%'
        }
        if (typeof editor.resize === 'function') editor.resize()
        fitDocxPreview(editor)
      })
    }
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reflowPreview) : null
    resizeObserver?.observe(viewport)
    window.addEventListener('resize', reflowPreview)
    reflowPreview()
    window.setTimeout(reflowPreview, 120)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', reflowPreview)
      resizeObserver?.disconnect()
    }
  }, [isSetupPanelCollapsed, isDocxTemplate, docxEditorReady])

  const filteredTemplates = useMemo(() => {
    const q = debouncedTemplateQuery.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => `${t.name} ${t.description || ''}`.toLowerCase().includes(q))
  }, [templates, debouncedTemplateQuery])

  const filteredWorkers = useMemo(() => {
    const q = debouncedWorkerQuery.trim().toLowerCase()
    if (!q) return workers
    return workers.filter((w) =>
      `${w.name} ${w.cin} ${w.position} ${w.university || ''} ${w.branch || ''}`.toLowerCase().includes(q),
    )
  }, [workers, debouncedWorkerQuery])

  const isTemplateSelected = Boolean(selectedTemplate)
  const isWorkerSelected = Boolean(workerId)
  const canGenerate = isTemplateSelected && (isDocxTemplate || Boolean(finalHtml))

  const handleTemplateChange = (id) => {
    setExportMessage('')
    setDocxEditorReady(false)
    setManualPreviewHtml('')
    setTemplateId(id)
  }

  const handleWorkerChange = (id) => {
    setExportMessage('')
    setManualPreviewHtml('')
    setWorkerId(id)
    const worker = workers.find((w) => w.id === id)
    if (!worker) { setFormValues(emptyFormValues); return }
    setFormValues({
      name: worker.name || '',
      cin: worker.cin || '',
      contractType: worker.contractType || '',
      entryDate: worker.entryDate || '',
      position: worker.position || '',
      internshipPeriodFrom: worker.internshipPeriodFrom || '',
      internshipPeriodTo: worker.internshipPeriodTo || '',
      university: worker.university || '',
      branch: worker.branch || '',
      academicYear: worker.academicYear || '',
      internshipTasks: worker.internshipTasks || '',
    })
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setExportMessage('')
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const saveToHistoryManually = () => {
    saveToHistory()
    setSavedMessage('Saved to history.')
    toast({ message: 'Saved to history.', variant: 'success', duration: 3000 })
    setTimeout(() => setSavedMessage(''), 3000)
  }

  const saveToHistory = () => {
    if (!selectedTemplate) return
    const entry = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      workerId,
      workerName: formValues.name || 'Unknown',
      isDocx: isDocxTemplate,
    }
    if (isDocxTemplate) {
      const editor = docxPreviewRef.current?.documentEditor
      entry.sfdt = typeof editor?.serialize === 'function'
        ? editor.serialize()
        : applyValuesToSfdt(selectedTemplate.sfdt, templateValues)
    } else {
      entry.html = finalHtml
    }
    upsertHistoryEntry(entry)
  }

  const printDocument = () => {
    if (isDocxTemplate) {
      const editor = docxPreviewRef.current?.documentEditor
      if (!editor) { setExportMessage('Document is not ready yet. Please wait a moment and try again.'); return }
      try { editor.print(); saveToHistory() } catch { setExportMessage('Print failed. Try downloading as DOCX instead.') }
      return
    }
    if (!selectedTemplate || !finalHtml) return
    const html = buildDocumentHtml(finalHtml, selectedTemplate.name)
    const printWindow = window.open('', '_blank', 'width=860,height=960')
    if (!printWindow) { setExportMessage('Could not open print window. Please allow pop-ups for this page.'); return }
    saveToHistory()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 400)
  }

  const hasNoTemplates = templates.length === 0
  const hasNoWorkers = workers.length === 0

  return (
    <section className="space-y-6 animate-fade-in" aria-labelledby="generate-title">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Document generation studio
            </div>
            <h1 id="generate-title" className="text-xl font-semibold tracking-tight">Generate</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Select template and user, review output, then print or save with minimal friction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isTemplateSelected ? 'success' : 'muted'}>{isTemplateSelected ? 'Template selected' : 'Select template'}</Badge>
            <Badge variant={isWorkerSelected ? 'success' : 'muted'}>{isWorkerSelected ? 'User selected' : 'Select user'}</Badge>
            <Badge variant={canGenerate ? 'default' : 'muted'}>{canGenerate ? 'Ready to export' : 'Setup required'}</Badge>
          </div>
        </div>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-center rounded-xl border border-border/70 bg-card/80 px-4 py-3">
        <StepItem
          number={1}
          done={isTemplateSelected}
          label="Template"
          sublabel={isTemplateSelected ? selectedTemplate.name : 'Select'}
        />
        <div className={cn('flex-1 h-px mx-1 transition-colors', isTemplateSelected ? 'bg-primary/50' : 'bg-border/60')} />
        <StepItem
          number={2}
          done={isWorkerSelected}
          label="User"
          sublabel={isWorkerSelected ? formValues.name || 'Selected' : 'Select'}
        />
        <div className={cn('flex-1 h-px mx-1 transition-colors', isWorkerSelected ? 'bg-primary/50' : 'bg-border/60')} />
        <StepItem
          number={3}
          done={canGenerate}
          label="Export"
          sublabel={canGenerate ? 'Ready' : 'Pending'}
        />
      </div>

      <div className={cn('grid gap-5', isSetupPanelCollapsed ? 'xl:grid-cols-1' : 'xl:grid-cols-[1fr_360px]')}>
        {/* Preview card — shown second on mobile (order-2), first on xl */}
        <Card className="min-w-0 order-2 border-border/70 shadow-sm xl:order-1">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Generated preview</CardTitle>
                <CardDescription>Edit directly in the preview, then print.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={printDocument}
                  disabled={!canGenerate}
                  aria-label="Print or save as PDF"
                >
                  <Printer className="size-4" />
                  Print / PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveToHistoryManually}
                  disabled={!canGenerate}
                  aria-label="Save to history"
                >
                  <BookmarkCheck className="size-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSetupPanelCollapsed((prev) => !prev)}
                  aria-label={isSetupPanelCollapsed ? 'Show setup panel' : 'Collapse setup panel'}
                  aria-expanded={!isSetupPanelCollapsed}
                  className="hidden xl:inline-flex"
                >
                  {isSetupPanelCollapsed
                    ? <PanelRightOpen className="size-4" />
                    : <PanelRightClose className="size-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDocxTemplate ? (
              <div ref={previewViewportRef} className="min-w-0 overflow-hidden">
                <DocumentEditorContainerComponent
                  key="docx-preview"
                  ref={docxPreviewRef}
                  id="generate-docx-preview"
                  width="100%"
                  height="calc(100vh - 200px)"
                  style={{ minHeight: '600px' }}
                  enableToolbar={false}
                  enablePropertiesPane={false}
                  serviceUrl={DOC_EDITOR_SERVICE_URL}
                  enableSpellCheck={false}
                  created={() => {
                    setDocxEditorReady(true)
                    const container = docxPreviewRef.current
                    if (typeof container?.showNavigationPane === 'function') container.showNavigationPane(false)
                    if (typeof container?.showPropertiesPane === 'function') container.showPropertiesPane(false)
                  }}
                />
              </div>
            ) : finalHtml ? (
              <div className="doc-preview-frame">
                <div className="doc-preview-page">
                  <div
                    contentEditable={isPreviewEditable}
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Document preview — editable"
                    onInput={(event) => {
                      if (isPreviewEditable) setManualPreviewHtml(event.currentTarget.innerHTML)
                    }}
                    dangerouslySetInnerHTML={{ __html: finalHtml }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/20 py-12 text-center">
                <Files className="size-10 text-muted-foreground/30" />
                <p className="text-sm font-medium">No preview yet</p>
                <p className="text-xs text-muted-foreground">
                  {hasNoTemplates
                    ? 'Start by creating a template.'
                    : hasNoWorkers
                    ? 'Add a worker to continue.'
                    : 'Select a template and user to preview your document.'}
                </p>
                {hasNoTemplates && (
                  <Button asChild size="sm" variant="outline" className="mt-1">
                    <Link to="/templates">Create template</Link>
                  </Button>
                )}
                {!hasNoTemplates && hasNoWorkers && (
                  <Button asChild size="sm" variant="outline" className="mt-1">
                    <Link to="/users">Add User</Link>
                  </Button>
                )}
              </div>
            )}

            {exportMessage && (
              <div className="animate-in slide-in-from-top-2 fade-in rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
                {exportMessage}
              </div>
            )}
            {savedMessage && (
              <div className="animate-in slide-in-from-top-2 fade-in flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <BookmarkCheck className="size-4 shrink-0" />
                {savedMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup panel — shown first on mobile */}
        {!isSetupPanelCollapsed && (
          <aside className="min-w-0 space-y-5 order-1 xl:order-2 xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto xl:pr-1" aria-label="Generation setup panel">
            {/* Options */}
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <OptionSwitch
                  title="Stamped"
                  checked={Boolean(stampImage) && applyStamp}
                  disabled={!stampImage}
                  onToggle={() => {
                    setApplyStamp((prev) => !prev)
                    setManualPreviewHtml('')
                  }}
                  description={stampImage
                    ? hasStampPlaceholder
                      ? 'Placeholder found. Enable to place stamp at {{STAMP}}, disable to skip it.'
                      : 'No {{STAMP}} placeholder found. If enabled, stamp will be appended at the bottom-right.'
                    : <><Link to="/settings" className="text-primary underline underline-offset-2">Upload a stamp</Link> in Settings first.</>}
                />
              </CardContent>
            </Card>

            {/* Step 1: Template */}
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={cn('flex size-5 items-center justify-center rounded-full text-xs font-bold', isTemplateSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {isTemplateSelected ? '✓' : '1'}
                  </span>
                  Choose Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Search template"
                    className="pl-9"
                    aria-label="Search templates"
                  />
                </div>
                <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
                  {hasNoTemplates ? (
                    <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-2">No templates created yet.</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/templates">Create template</Link>
                      </Button>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 text-sm text-muted-foreground">
                      No template matches your search.
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateChange(template.id)}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left transition-colors',
                          templateId === template.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border/70 bg-card hover:bg-accent/60',
                        )}
                      >
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description || 'No description'}</p>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Worker */}
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={cn('flex size-5 items-center justify-center rounded-full text-xs font-bold', isWorkerSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {isWorkerSelected ? '✓' : '2'}
                  </span>
                  Choose User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={workerQuery}
                    onChange={(e) => setWorkerQuery(e.target.value)}
                    placeholder="Search user"
                    className="pl-9"
                    disabled={!isTemplateSelected}
                    aria-label="Search users"
                  />
                </div>
                <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
                  {!isTemplateSelected ? (
                    <p className="text-xs text-muted-foreground p-2">Select a template first.</p>
                  ) : hasNoWorkers ? (
                    <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-2">No user added yet.</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/users">Add User</Link>
                      </Button>
                    </div>
                  ) : filteredWorkers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 text-sm text-muted-foreground">
                      No user matches your search.
                    </div>
                  ) : (
                    filteredWorkers.map((worker) => {
                      const isIntern = worker.workerType === 'internship'
                      return (
                        <button
                          key={worker.id}
                          type="button"
                          onClick={() => handleWorkerChange(worker.id)}
                          className={cn(
                            'w-full rounded-lg border p-3 text-left transition-colors',
                            workerId === worker.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border/70 bg-card hover:bg-accent/60',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{worker.name}</p>
                            <Badge variant={isIntern ? 'intern' : 'employee'} className="shrink-0 text-[10px]">
                              {isIntern ? 'Intern' : 'Employee'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{worker.cin}</p>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Document data */}
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={cn('flex size-5 items-center justify-center rounded-full text-xs font-bold', canGenerate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {canGenerate ? '✓' : '3'}
                  </span>
                  Document Data
                </CardTitle>
                <CardDescription>Adjust values before export.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={formValues.name} onChange={handleInputChange} disabled={!isTemplateSelected} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cin">CIN</Label>
                  <Input id="cin" name="cin" value={formValues.cin} onChange={handleInputChange} disabled={!isTemplateSelected} />
                </div>

                {/* Employee-only fields */}
                {selectedWorkerType !== 'internship' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contractType">Contract type</Label>
                      <Input id="contractType" name="contractType" value={formValues.contractType} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entryDate">Entry date</Label>
                      <Input id="entryDate" name="entryDate" type="date" value={formValues.entryDate} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                      <Label htmlFor="position">Position</Label>
                      <Input id="position" name="position" value={formValues.position} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                  </>
                )}

                {/* Internship-only fields */}
                {selectedWorkerType === 'internship' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="internshipPeriodFrom">Period from</Label>
                      <Input id="internshipPeriodFrom" name="internshipPeriodFrom" type="date" value={formValues.internshipPeriodFrom} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internshipPeriodTo">Period to</Label>
                      <Input id="internshipPeriodTo" name="internshipPeriodTo" type="date" value={formValues.internshipPeriodTo} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input id="university" name="university" value={formValues.university} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input id="branch" name="branch" value={formValues.branch} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic year</Label>
                      <Input id="academicYear" name="academicYear" value={formValues.academicYear} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                      <Label htmlFor="position">Role / Title</Label>
                      <Input id="position" name="position" value={formValues.position} onChange={handleInputChange} disabled={!isTemplateSelected} />
                    </div>
                    <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                      <Label htmlFor="internshipTasks">Internship tasks</Label>
                      <Input id="internshipTasks" name="internshipTasks" value={formValues.internshipTasks} onChange={handleInputChange} disabled={!isTemplateSelected} placeholder="Report writing, data collection…" />
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          </aside>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 p-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Button type="button" className="flex-1" onClick={printDocument} disabled={!canGenerate}>
            <Printer className="size-4" />
            Print / PDF
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={saveToHistoryManually} disabled={!canGenerate}>
            <BookmarkCheck className="size-4" />
            Save
          </Button>
        </div>
      </div>
    </section>
  )
}
