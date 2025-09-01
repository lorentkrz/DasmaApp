"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseForm } from "@/components/expense-form"

interface BudgetExpenseListProps {
  wedding: any
  expenses: any[]
  categories: { id: string; name: string }[]
}

export function BudgetExpenseList({ wedding, expenses, categories }: BudgetExpenseListProps) {
  const [open, setOpen] = useState(false)
  const [expense, setExpense] = useState<any | null>(null)

  const onEdit = (exp: any) => {
    setExpense(exp)
    setOpen(true)
  }

  return (
    <>
      <ExpenseList expenses={expenses} categories={categories} onEdit={onEdit} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {expense && (
            <ExpenseForm wedding={wedding} expense={expense} categories={categories} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
