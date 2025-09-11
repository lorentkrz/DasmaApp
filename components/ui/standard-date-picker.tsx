"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface StandardDatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showTime?: boolean
  minDate?: Date
  maxDate?: Date
}

export function StandardDatePicker({
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  className,
  disabled = false,
  showTime = false,
  minDate,
  maxDate,
}: StandardDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    if (value && isValid(value)) {
      const formatStr = showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"
      setInputValue(format(value, formatStr))
    } else {
      setInputValue("")
    }
  }, [value, showTime])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    // Try to parse the input
    const formatStr = showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"
    const parsed = parse(val, formatStr, new Date())
    
    if (isValid(parsed)) {
      if (minDate && parsed < minDate) return
      if (maxDate && parsed > maxDate) return
      onChange(parsed)
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve time if showTime is true and there's an existing value
      if (showTime && value) {
        date.setHours(value.getHours())
        date.setMinutes(value.getMinutes())
      }
      onChange(date)
      if (!showTime) {
        setOpen(false)
      }
    } else {
      onChange(undefined)
    }
  }

  const handleToday = () => {
    const today = new Date()
    onChange(today)
    setOpen(false)
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={showTime ? "YYYY-MM-DD HH:MM" : placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start text-left font-normal px-3",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass rounded-lg border border-white/20 dark:border-white/10 shadow-lg" align="end">
          <div className="p-3 border-b border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 rounded-t-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="w-full"
            >
              Sot
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            buttonVariant="outline"
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
          />
          {showTime && value && (
            <div className="p-3 border-t border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={format(value, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const newDate = new Date(value)
                    newDate.setHours(parseInt(hours))
                    newDate.setMinutes(parseInt(minutes))
                    onChange(newDate)
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
