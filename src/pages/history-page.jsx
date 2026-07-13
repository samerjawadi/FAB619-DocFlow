import { useEffect, useMemo, useRef, useState } from 'react'
import { DocumentEditorContainerComponent, Toolbar as DocumentEditorToolbar } from '@syncfusion/ej2-react-documenteditor'
import { CalendarClock, Clock, FileText, Filter, Printer, Search, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useAppData } from '../hooks/use-app-data'
import { useDebounce } from '../hooks/use-debounce'
import { useToast } from '../context/toast-context'

if (!globalThis.__docflowHistoryToolbarInjected) {
  DocumentEditorContainerComponent.Inject(DocumentEditorToolbar)
  globalThis.__docflowHistoryToolbarInjected = true
}

const DOC_EDITOR_SERVICE_URL = 'https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/'

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

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function DocxViewer({ entry, editable, onSfdt }) {
  const editorRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready || !editorRef.current?.documentEditor || !entry.sfdt) return
    const editor = editorRef.current.documentEditor
    editor.isReadOnly = false
    editor.open(entry.sfdt)
    editor.isReadOnly = !editable
    if (typeof editor.fitPage === 'function') editor.fitPage('FitPageWidth')
    if (typeof editor.zoomFactor === 'number' && editor.zoomFactor > 1) editor.zoomFactor = 1
  }, [ready, entry, editable])

  const handleSave = () => {
    const editor = editorRef.current?.documentEditor
    if (!editor) return
    editor.saveAsBlob('Sfdt').then((blob) => blob.text().then((text) => onSfdt && onSfdt(text)))
  }

  const handlePrint = () => editorRef.current?.documentEditor?.print()

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex gap-2">
          <Button type="button" onClick={handleSave}>Save changes</Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      )}
      <DocumentEditorContainerComponent
        ref={editorRef}
        width="100%"
        height="calc(90vh - 180px)"
        style={{ minHeight: '400px' }}
        enableToolbar={editable}
        enablePropertiesPane={false}
        serviceUrl={DOC_EDITOR_SERVICE_URL}
        enableSpellCheck={false}
        created={() => setReady(true)}
      />
    </div>
  )
}

function HtmlViewer({ entry, editable, onHtml }) {
  const [html, setHtml] = useState(entry.html || '')

  const handlePrint = () => {
    const content = buildDocumentHtml(html, `${entry.templateName} – ${entry.workerName}`)
    const win = window.open('', '_blank', 'width=860,height=960')
    if (!win) return
    win.document.write(content)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex gap-2">
          <Button type="button" onClick={() => onHtml && onHtml(html)}>Save changes</Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      )}
      <div className="doc-preview-frame">
        <div className="doc-preview-page">
          <div
            contentEditable={editable}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Document content — editable"
            onInput={(e) => setHtml(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { history, deleteHistoryEntry, updateHistoryEntry } = useAppData()
  const { toast } = useToast()
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [displayEntry, setDisplayEntry] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 250)

  const filteredHistory = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return history
    return history.filter(
      (entry) =>
        entry.templateName.toLowerCase().includes(q) ||
        entry.workerName.toLowerCase().includes(q),
    )
  }, [history, debouncedQuery])

  const handleDelete = (id) => {
    deleteHistoryEntry(id)
    setDeleteId(null)
    if (displayEntry?.id === id) setIsViewerOpen(false)
  }

  const handleSaveSfdt = (sfdt) => {
    updateHistoryEntry(displayEntry.id, { sfdt })
    setDisplayEntry((prev) => ({ ...prev, sfdt }))
    toast({ message: 'Changes saved successfully.', variant: 'success', duration: 3000 })
  }

  const handleSaveHtml = (html) => {
    updateHistoryEntry(displayEntry.id, { html })
    setDisplayEntry((prev) => ({ ...prev, html }))
    toast({ message: 'Changes saved successfully.', variant: 'success', duration: 3000 })
  }

  const handlePrintHtml = (entry) => {
    const content = buildDocumentHtml(entry.html || '', `${entry.templateName} – ${entry.workerName}`)
    const win = window.open('', '_blank', 'width=860,height=960')
    if (!win) return
    win.document.write(content)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const docxCount = history.filter((entry) => entry.isDocx).length
  const htmlCount = history.length - docxCount

  return (
    <section className="space-y-6 animate-fade-in" aria-labelledby="history-title">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Document timeline
            </div>
            <h1 id="history-title" className="text-xl font-semibold tracking-tight">History</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Review, print, edit, and manage previously generated documents.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{history.length} total</Badge>
            <Badge variant="docx">{docxCount} DOCX</Badge>
            <Badge variant="html">{htmlCount} HTML</Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Find history entries</CardTitle>
          <CardDescription>Search by worker or template to reduce scanning time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or template"
              className="pl-9"
              aria-label="Search history"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Clock className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No history yet</p>
                <p className="text-sm text-muted-foreground">
                  Generate a document and click <strong>Save</strong> to see it here.
                </p>
              </CardContent>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                No entries match "{debouncedQuery}".
              </CardContent>
            </Card>
          ) : (
            <>
              {debouncedQuery && (
                <p className="text-xs text-muted-foreground">{filteredHistory.length} of {history.length} entries</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHistory.map((entry) => (
                  <Card key={entry.id} className="flex flex-col border-border/70">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm">{entry.templateName}</CardTitle>
                          <CardDescription className="truncate">{entry.workerName}</CardDescription>
                        </div>
                        <Badge variant={entry.isDocx ? 'docx' : 'html'} className="shrink-0">
                          {entry.isDocx ? 'DOCX' : 'HTML'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-wrap gap-2 pt-0">
                      <Button type="button" size="sm" onClick={() => { setDisplayEntry(entry); setIsViewerOpen(true) }}>
                        <FileText className="size-4" />
                        Open
                      </Button>
                      {!entry.isDocx && (
                        <Button type="button" size="sm" variant="outline" onClick={() => handlePrintHtml(entry)}>
                          <Printer className="size-4" />
                          Print
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        onClick={() => setDeleteId(entry.id)}
                        aria-label={`Delete ${entry.templateName} for ${entry.workerName}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">History Insights</CardTitle>
              <CardDescription>Keep document traceability healthy and searchable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <Filter className="size-4 text-muted-foreground" />
                  Current results
                </span>
                <Badge variant="muted">{filteredHistory.length}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-foreground">Recent format mix</span>
                <span className="text-xs text-muted-foreground">DOCX {docxCount} / HTML {htmlCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: keep template names specific so search results are easier to scan and audit.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Delete entry?
            </DialogTitle>
            <DialogDescription>This history entry will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document viewer */}
      <Dialog open={isViewerOpen} onOpenChange={(open) => !open && setIsViewerOpen(false)}>
        <DialogContent
          className="max-w-[92vw] w-full max-h-[92vh] flex flex-col p-0 overflow-hidden"
          showClose={false}
        >
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm">
                  {displayEntry?.templateName} — {displayEntry?.workerName}
                </DialogTitle>
                <DialogDescription>{displayEntry && formatDate(displayEntry.createdAt)}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" size="icon" variant="ghost" aria-label="Close viewer">
                  <X className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {displayEntry?.isDocx ? (
              <DocxViewer entry={displayEntry} editable={true} onSfdt={handleSaveSfdt} />
            ) : (
              <HtmlViewer key={displayEntry?.id} entry={displayEntry} editable={true} onHtml={handleSaveHtml} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
