"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface ExpenseFormProps {
  wedding: any
  expense?: any
  categories?: { id: string; name: string }[]
}

export function ExpenseForm({ wedding, expense, categories = [] }: ExpenseFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount || "",
    category_id: expense?.category_id || "",
    expense_date: expense?.expense_date || new Date().toISOString().split("T")[0],
    is_paid: (expense?.payment_status === "paid") || false,
    notes: expense?.notes || "",
    payment_method: expense?.payment_method || "",
    receipt_url: expense?.receipt_url || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      // Ensure we include created_by to satisfy RLS policy
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) throw new Error("Not authenticated")

      const expenseData = {
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        expense_date: formData.expense_date,
        // Map boolean to enum text in schema
        payment_status: formData.is_paid ? "paid" : "pending",
        payment_method: formData.payment_method || null,
        receipt_url: formData.receipt_url || null,
        notes: formData.notes,
        // Columns present in DB
        wedding_id: wedding.id,
        created_by: user.id,
        // Optional relationship columns (not selected via UI yet)
        category_id: formData.category_id || null,
        vendor_id: null as string | null,
      }

      if (expense) {
        // Update existing expense
        const { error } = await supabase.from("expenses").update(expenseData).eq("id", expense.id)

        if (error) throw error
      } else {
        // Create new expense
        const { error } = await supabase.from("expenses").insert([expenseData])

        if (error) throw error
      }

      router.push("/dashboard/budget")
      router.refresh()
    } catch (error) {
      console.error("Error saving expense:", error)
      const message = (error as any)?.message || "Unable to save expense. Please try again."
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/budget">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <CardTitle className="text-slate-900">{expense ? "Edit Expense" : "New Expense"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {errorMsg}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Wedding venue deposit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <select
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="e.g., credit card, bank transfer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
              />
              <Label htmlFor="is_paid">Paid</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this expense..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL</Label>
            <Input
              id="receipt_url"
              value={formData.receipt_url}
              onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/budget">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
