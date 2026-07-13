import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary ring-primary/20',
        employee: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/40',
        intern: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-700/40',
        docx: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/40',
        html: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/40',
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/40',
        muted: 'bg-muted text-muted-foreground ring-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
