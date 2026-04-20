import * as React from 'react'
import { cn } from '../lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Card }
