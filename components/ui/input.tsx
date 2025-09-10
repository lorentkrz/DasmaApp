import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[var(--text-muted)] dark:placeholder:text-[var(--text-muted-dark)] selection:bg-primary selection:text-primary-foreground bg-[var(--card-bg)] dark:bg-[var(--card-bg-dark)] border-[var(--border-2025)] dark:border-[var(--border-dark)] flex h-9 w-full min-w-0 rounded-md border backdrop-blur-sm px-3 py-1 text-base shadow-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-[var(--text-2025)] dark:text-[var(--text-dark)]",
        "focus-visible:border-[#4338CA] focus-visible:ring-[#4338CA]/20 focus-visible:ring-2",
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
