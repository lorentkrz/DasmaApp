"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GuestsImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/dashboard/guests/import", { method: "POST", body: form })
    const text = await res.text()
    setResult(res.ok ? text : `Error: ${text}`)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Import Guests</CardTitle>
          <CardDescription>Upload a CSV exported from this app or using the same headers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!file || loading}>{loading ? "Importing..." : "Import"}</Button>
              <a className="text-sm underline" href="/dashboard/guests/export">Download sample CSV</a>
            </div>
          </form>
          {result && <div className="text-sm whitespace-pre-wrap">{result}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
