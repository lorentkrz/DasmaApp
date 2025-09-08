"use client"

import * as React from "react"
import { Check, ChevronDown, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface StandardDropdownProps {
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
  options: Array<{
    value: string
    label: string
    description?: string
    icon?: React.ReactNode
    badge?: string
  }>
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  multiple?: boolean
  maxResults?: number
  showCount?: boolean
}

export function StandardDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className,
  disabled = false,
  loading = false,
  multiple = false,
  maxResults = 30,
  showCount = true,
}: StandardDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredOptions = React.useMemo(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtered.slice(0, maxResults)
  }, [options, searchQuery, maxResults])

  const selectedValues = React.useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const selectedLabels = React.useMemo(() => {
    return selectedValues
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean)
  }, [selectedValues, options])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onValueChange(newValues)
    } else {
      onValueChange(optionValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : selectedLabels.length > 0 ? (
              multiple ? (
                <span className="flex items-center gap-1">
                  {selectedLabels[0]}
                  {selectedLabels.length > 1 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      +{selectedLabels.length - 1}
                    </Badge>
                  )}
                </span>
              ) : (
                selectedLabels[0]
              )
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {showCount && filteredOptions.length < options.length && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Showing {filteredOptions.length} of {options.length}
                </div>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {selectedValues.includes(option.value) && (
                      <Check className="ml-auto h-4 w-4 shrink-0" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
