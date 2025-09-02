"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function NewTablePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    tableNumber: "",
    tableName: "",
    capacity: "8",
    tableType: "round",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get user's current wedding
      const { data: weddings } = await supabase
        .from("weddings")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (!weddings || weddings.length === 0) {
        throw new Error("No wedding found")
      }

      const { error: insertError } = await supabase.from("wedding_tables").insert({
        wedding_id: weddings[0].id,
        table_number: Number.parseInt(formData.tableNumber),
        table_name: formData.tableName || null,
        capacity: Number.parseInt(formData.capacity),
        table_type: formData.tableType,
        position_x: Math.random() * 300 + 50, // Random initial position
        position_y: Math.random() * 200 + 50,
        notes: formData.notes || null,
      })

      if (insertError) throw insertError

      router.push("/dashboard/seating/tables")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/seating/tables">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Plus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Shto Tavolinë të Re</h1>
          <p className="text-gray-600">Krijoni një tavolinë të re për uljet në pritje</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Detajet e Tavolinës</CardTitle>
            <CardDescription>Konfiguroni tavolinën tuaj të re për pritje</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Numri i Tavolinës *</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    min="1"
                    required
                    value={formData.tableNumber}
                    onChange={(e) => handleInputChange("tableNumber", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableName">Emri i Tavolinës</Label>
                  <Input
                    id="tableName"
                    type="text"
                    placeholder="p.sh., Tavolina e Familjes"
                    value={formData.tableName}
                    onChange={(e) => handleInputChange("tableName", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Kapaciteti *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableType">Lloji i Tavolinës *</Label>
                  <Select value={formData.tableType} onValueChange={(value) => handleInputChange("tableType", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-slate-400 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Rrethore</SelectItem>
                      <SelectItem value="rectangular">Drejtkëndore</SelectItem>
                      <SelectItem value="square">Katror</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Shënime</Label>
                <Textarea
                  id="notes"
                  placeholder="Shënime të veçanta për këtë tavolinë"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Duke krijuar..." : "Krijo Tavolinë"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/seating/tables">Anulo</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
