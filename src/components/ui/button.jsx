import { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

const buttonVariants = {
  base: 'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cursor-orange)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variant: {
    primary: 'bg-[var(--cursor-surface-300)] text-[var(--cursor-ink)] hover:text-[var(--cursor-error)]',
    secondary: 'border border-[var(--cursor-border-10)] bg-[var(--cursor-surface-400)] text-[var(--cursor-ink)] hover:bg-[var(--cursor-surface-500)] hover:border-[var(--cursor-border-20)]',
    ghost: 'text-[var(--cursor-border-55)] hover:bg-[var(--cursor-surface-300)] hover:text-[var(--cursor-error)]',
    destructive: 'bg-[var(--cursor-error)] text-white hover:opacity-90',
    accent: 'bg-[var(--cursor-orange)] text-white hover:bg-[var(--cursor-orange-hover)]',
  },
  size: {
    default: 'px-4 py-2.5',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  },
}

const Button = forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  return (
    <button
      className={cn(
        buttonVariants.base,
        buttonVariants.variant[variant],
        variant === 'accent' || variant === 'destructive' ? 'rounded-lg' : 'rounded-lg',
        buttonVariants.size[size],
        className
      )}
      ref={ref}
      style={{ ...({ borderRadius: 'var(--seed-radius)' }), ...(props?.style) }}
      {...props}
     data-qoder-id={props?.["data-qoder-id"]} data-qoder-source={props?.["data-qoder-source"]}/>
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
