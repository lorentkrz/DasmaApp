"use client"

import { useState, ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expense-form"

interface BudgetEditDialogProps {
  categories: { id: string; name: string }[]
  children: (openEdit: (expense: any) => void) => ReactNode
}

export function BudgetEditDialog({ categories, children }: BudgetEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [expense, setExpense] = useState<any | null>(null)

  const openEdit = (exp: any) => {
    setExpense(exp)
    setOpen(true)
  }

  return (
    <>
      {children(openEdit)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Ndrysho Shpenzimin</DialogTitle>
          </DialogHeader>
          {expense && (
            <ExpenseForm wedding={{ id: expense.wedding_id }} expense={expense} categories={categories} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
