import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[var(--border-2025)] dark:border-[var(--border-dark)] placeholder:text-[var(--text-muted)] dark:placeholder:text-[var(--text-muted-dark)] focus-visible:border-[#4338CA] focus-visible:ring-[#4338CA]/20 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 bg-[var(--card-bg)]/50 dark:bg-[var(--card-bg-dark)]/50 flex field-sizing-content min-h-16 w-full rounded-md border backdrop-blur-sm px-3 py-2 text-base shadow-sm transition-[color,box-shadow,border-color] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-[var(--text-2025)] dark:text-[var(--text-dark)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
