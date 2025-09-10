"use client"

import * as React from "react"
import { StandardDropdown } from "@/components/ui/standard-dropdown"

export type SearchableOption = {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  badge?: string
}

export type SearchableDropdownProps = {
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  loading?: boolean
  multiple?: boolean
  maxResults?: number
  showCount?: boolean
  className?: string
}

export function SearchableDropdown(props: SearchableDropdownProps) {
  return <StandardDropdown {...props} />
}
