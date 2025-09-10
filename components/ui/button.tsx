import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#4338CA] to-[#2563EB] text-white border border-[#4338CA]/30 hover:from-[#3730A3] hover:to-[#1D4ED8] shadow-md",
        destructive:
          "bg-gradient-to-r from-[#7F1D1D] to-[#EF4444] text-white border border-red-500/30 hover:from-[#991B1B] hover:to-[#DC2626] shadow-md",
        outline:
          "border border-[var(--border-2025)] bg-transparent shadow-sm hover:bg-[var(--card-bg)] hover:border-[#4338CA]/50 dark:border-[var(--border-dark)] dark:hover:bg-[var(--card-bg-dark)]",
        secondary:
          "bg-[var(--sidebar-bg)] text-[var(--text-2025)] border border-[var(--border-2025)] hover:bg-[var(--card-bg)] shadow-sm dark:bg-[var(--sidebar-bg-dark)] dark:text-[var(--text-dark)] dark:border-[var(--border-dark)]",
        ghost:
          "hover:bg-[var(--card-bg)] hover:border-[var(--border-2025)] border border-transparent text-[var(--text-2025)] dark:hover:bg-[var(--card-bg-dark)] dark:text-[var(--text-dark)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
