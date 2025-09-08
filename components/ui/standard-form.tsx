"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  required = false,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  className?: string
  children: React.ReactNode
}

export function FormSection({
  title,
  description,
  className,
  children,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

interface CompactFormProps {
  onSubmit: (e: React.FormEvent) => void
  className?: string
  children: React.ReactNode
}

export function CompactForm({
  onSubmit,
  className,
  children,
}: CompactFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
    >
      {children}
    </form>
  )
}
