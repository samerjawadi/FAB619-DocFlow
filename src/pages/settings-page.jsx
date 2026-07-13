import { useMemo, useRef } from 'react'
import { CheckCircle2, LayoutGrid, MonitorSmartphone, Settings, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useSettings } from '../hooks/use-settings'

const DEFAULT_STAMP_WIDTH = 140
const DEFAULT_STAMP_HEIGHT = 80

const settingsSections = [
  { id: 'brand-assets', label: 'Brand Assets' },
  { id: 'rendering-size', label: 'Rendering Size' },
  { id: 'usage-guide', label: 'Usage Guide' },
]

function ImageUploadSection({
  title,
  description,
  image,
  onUpload,
  onClear,
  stampWidth,
  stampHeight,
  onStampWidthChange,
  onStampHeightChange,
}) {
  const inputRef = useRef(null)
  const fileInputId = 'company-stamp-upload'
  const statusMessage = image ? 'Stamp image uploaded and ready.' : 'No stamp image uploaded yet.'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpload(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={image ? 'success' : 'muted'}>{image ? 'Configured' : 'Missing asset'}</Badge>
        </div>
        <CardDescription id="company-stamp-help">{description}</CardDescription>
        <p className="sr-only" aria-live="polite">{statusMessage}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {image ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-xl border border-border/70 bg-muted/30 p-3">
              <img src={image} alt="Uploaded company stamp" className="max-h-24 max-w-[210px] object-contain" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                aria-describedby="company-stamp-help"
              >
                <Upload className="size-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={onClear}
              >
                <X className="size-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border/70 bg-muted/20 p-5 sm:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Upload className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload PNG, JPG, or SVG for best print quality.</p>
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
            </div>
          </div>
        )}

        <fieldset className="grid gap-4 rounded-lg border border-border/60 bg-background p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium text-foreground">Stamp dimensions</legend>
          <div className="space-y-2">
            <Label htmlFor="stampWidth">Width in pixels</Label>
            <Input
              id="stampWidth"
              type="number"
              min="1"
              max="2000"
              step="1"
              value={stampWidth}
              aria-describedby="stamp-size-help"
              onChange={(e) => onStampWidthChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stampHeight">Height in pixels</Label>
            <Input
              id="stampHeight"
              type="number"
              min="1"
              max="2000"
              step="1"
              value={stampHeight}
              aria-describedby="stamp-size-help"
              onChange={(e) => onStampHeightChange(e.target.value)}
            />
          </div>
          <p id="stamp-size-help" className="sm:col-span-2 text-xs text-muted-foreground">
            Recommended default is {DEFAULT_STAMP_WIDTH} x {DEFAULT_STAMP_HEIGHT}. Values are applied immediately.
          </p>
        </fieldset>

        <input
          id={fileInputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-describedby="company-stamp-help"
        />
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const {
    stampImage,
    stampWidth,
    stampHeight,
    setStampImage,
    setStampWidth,
    setStampHeight,
  } = useSettings()

  const isDefaultSize = stampWidth === DEFAULT_STAMP_WIDTH && stampHeight === DEFAULT_STAMP_HEIGHT
  const ratioText = useMemo(() => {
    if (!stampWidth || !stampHeight) return 'Not available'
    const ratio = stampWidth / stampHeight
    return `${ratio.toFixed(2)}:1`
  }, [stampHeight, stampWidth])

  return (
    <section className="space-y-6 animate-fade-in" aria-labelledby="settings-title">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Modern SaaS settings
            </div>
            <div className="flex items-center gap-2.5">
              <Settings className="size-5 text-muted-foreground" />
              <h2 id="settings-title" className="text-xl font-semibold tracking-tight">Settings</h2>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage brand assets and rendering behavior with real-time updates and accessible controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stampImage ? 'success' : 'muted'}>
              {stampImage ? 'Stamp ready' : 'Stamp missing'}
            </Badge>
            <Badge variant={isDefaultSize ? 'muted' : 'default'}>{isDefaultSize ? 'Default size' : 'Custom size'}</Badge>
          </div>
        </div>
      </div>

      <nav
        aria-label="Settings section navigation"
        className="rounded-xl border border-border/70 bg-card p-2 shadow-sm"
      >
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {settingsSections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section id="brand-assets" className="scroll-mt-24">
            <ImageUploadSection
              title="Company Stamp"
              description={
                <>
                  Upload your company stamp. Use{' '}
                  <code className="rounded bg-muted px-1 text-xs">{'{{STAMP}}'}</code> in a template to control exact placement.
                </>
              }
              image={stampImage}
              onUpload={setStampImage}
              onClear={() => setStampImage('')}
              stampWidth={stampWidth}
              stampHeight={stampHeight}
              onStampWidthChange={setStampWidth}
              onStampHeightChange={setStampHeight}
            />
          </section>

          <section id="rendering-size" className="scroll-mt-24">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Rendering Size</CardTitle>
                <CardDescription>
                  Keep output consistent across templates and devices. Current ratio: <strong className="text-foreground">{ratioText}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Width</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stampWidth}px</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Height</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stampHeight}px</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStampWidth(DEFAULT_STAMP_WIDTH)
                      setStampHeight(DEFAULT_STAMP_HEIGHT)
                    }}
                    disabled={isDefaultSize}
                  >
                    Reset to defaults
                  </Button>
                  <p className="self-center text-xs text-muted-foreground">Autosaved to local device settings.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="usage-guide" className="scroll-mt-24">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Usage Guide</CardTitle>
                <CardDescription>Follow this sequence to apply your stamp consistently in generated documents.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="rounded-lg border border-border/60 bg-background p-3">
                    Open <strong className="text-foreground">Generate</strong>, choose a template and worker.
                  </li>
                  <li className="rounded-lg border border-border/60 bg-background p-3">
                    Enable <strong className="text-foreground">Stamped</strong> before generating.
                  </li>
                  <li className="rounded-lg border border-border/60 bg-background p-3">
                    Insert <code className="rounded bg-muted px-1 text-xs">{'{{STAMP}}'}</code> in your template to control placement.
                  </li>
                  <li className="rounded-lg border border-border/60 bg-background p-3">
                    If no placeholder exists, the stamp is appended automatically to the bottom-right area.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Configuration Health</CardTitle>
              <CardDescription>Quick status for setup completeness and usability quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  Asset availability
                </span>
                <Badge variant={stampImage ? 'success' : 'muted'}>{stampImage ? 'Pass' : 'Needs action'}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <MonitorSmartphone className="size-4 text-muted-foreground" />
                  Mobile readiness
                </span>
                <Badge variant="success">Pass</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <LayoutGrid className="size-4 text-muted-foreground" />
                  Size consistency
                </span>
                <Badge variant={isDefaultSize ? 'muted' : 'default'}>{isDefaultSize ? 'Default' : 'Custom'}</Badge>
              </div>
              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5" />
                Changes are auto-saved, so no manual save button is required.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 p-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Button type="button" className="flex-1" onClick={() => document.getElementById('brand-assets')?.scrollIntoView({ behavior: 'smooth' })}>
            Update stamp
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setStampWidth(DEFAULT_STAMP_WIDTH)
              setStampHeight(DEFAULT_STAMP_HEIGHT)
            }}
          >
            Reset size
          </Button>
        </div>
      </div>
    </section>
  )
}
