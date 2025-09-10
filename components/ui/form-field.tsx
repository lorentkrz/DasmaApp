"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type FormFieldProps = {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  textarea?: boolean
  onSuggest?: () => void
  className?: string
}

export function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder = " ",
  error,
  hint,
  required,
  textarea,
  onSuggest,
  className,
}: FormFieldProps) {
  const InputTag = textarea ? "textarea" : "input"
  return (
    <div className={cn("relative", className)}>
      <InputTag
        id={id}
        value={value}
        onChange={onChange as any}
        placeholder={placeholder}
        required={required}
        className={cn(
          "peer w-full rounded-lg px-3 pt-5 pb-2 text-sm outline-none",
          "backdrop-blur-md bg-white/60 dark:bg-slate-800/50 border border-white/20 dark:border-white/10",
          "transition-[box-shadow,background,border] duration-[var(--duration-fast)] ease-[var(--easing)]",
          error ? "border-red-400/70" : "focus:border-[color:var(--primary)]",
          textarea ? "min-h-[88px]" : "h-12"
        )}
        {...(textarea ? { rows: 3 } : { type })}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-3 text-[13px] text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]",
          "transition-all duration-[var(--duration-fast)] ease-[var(--easing)]",
          "-translate-y-1/2 top-3.5",
          "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm",
          "peer-focus:-translate-y-1/2 peer-focus:top-3.5 peer-focus:text-[13px]"
        )}
      >
        {label}
      </label>
      {(hint || onSuggest) && !error && (
        <div className="mt-1.5 flex items-center justify-between">
          {hint && <div className="text-xs text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]">{hint}</div>}
          {onSuggest && (
            <button
              type="button"
              onClick={onSuggest}
              className="text-xs px-2 py-1 rounded-md border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/60"
            >
              Sugjero
            </button>
          )}
        </div>
      )}
      {error && <div className="mt-1.5 text-xs text-red-600">{error}</div>}
    </div>
  )
}
