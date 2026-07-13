import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../../context/theme-context'
import { Button } from './button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle color mode"
      title="Toggle color mode"
    >
      {theme === 'light' ? <MoonStar className="size-4" /> : <SunMedium className="size-4" />}
    </Button>
  )
}
