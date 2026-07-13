import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you requested does not exist. Return to document generator.
        </p>
        <Button asChild>
          <Link to="/">Go to generator</Link>
        </Button>
      </div>
    </main>
  )
}
