import { useRef } from 'react'
import { Settings, Upload, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useSettings } from '../hooks/use-settings'

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpload(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {image ? (
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-lg border border-border/70 bg-muted/30 p-3">
              <img src={image} alt={title} className="max-h-20 max-w-[180px] object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/70 bg-muted/20 p-8 text-center transition-colors hover:bg-muted/40 hover:border-primary/40"
          >
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload (PNG, JPG, SVG)</span>
          </button>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stampWidth">Width (px)</Label>
            <Input
              id="stampWidth"
              type="number"
              min="1"
              max="2000"
              step="1"
              value={stampWidth}
              onChange={(e) => onStampWidthChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stampHeight">Height (px)</Label>
            <Input
              id="stampHeight"
              type="number"
              min="1"
              max="2000"
              step="1"
              value={stampHeight}
              onChange={(e) => onStampHeightChange(e.target.value)}
            />
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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

  return (
    <section className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Settings className="size-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure app-level assets used when generating documents.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-1">
        <ImageUploadSection
          title="Company Stamp"
          description={
            <>
              Upload your company stamp. Use{' '}
              <code className="rounded bg-muted px-1 text-xs">{'{{STAMP}}'}</code> in a template to
              control exact placement. You can also set its width and height below.
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
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1.5">How to use</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Go to <strong className="text-foreground">Generate</strong>, select a template and user,
            then enable <strong className="text-foreground">Stamped</strong>.
          </li>
          <li>
            Add <code className="rounded bg-muted px-1 text-xs">{'{{STAMP}}'}</code> anywhere in
            your template to control exact placement.
          </li>
          <li>
            If no placeholder is found, the image is appended to the bottom-right automatically.
          </li>
        </ul>
      </div>
    </section>
  )
}
