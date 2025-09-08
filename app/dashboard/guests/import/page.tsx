"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Download, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function GuestsImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/dashboard/guests/import", { method: "POST", body: form })
      const text = await res.text()
      
      if (res.ok) {
        const lines = text.split('\n').filter(line => line.trim())
        const count = Math.max(0, lines.length - 1) // Subtract header row
        setResult({ success: true, message: text, count })
        toast.success(`${count} mysafirë u importuan me sukses!`)
      } else {
        setResult({ success: false, message: text })
        toast.error("Gabim gjatë importimit")
      }
    } catch (error) {
      setResult({ success: false, message: "Gabim në rrjet" })
      toast.error("Gabim në rrjet")
    }
    
    setLoading(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
      } else {
        toast.error("Ju lutem ngarkoni vetëm skedarë CSV")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/guests">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kthehu
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Importo Mysafirë</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ngarkoni një skedar CSV për të shtuar mysafirë në masë
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Ngarko Skedarin CSV
              </CardTitle>
              <CardDescription>
                Zgjidhni ose tërhiqni një skedar CSV me të dhënat e mysafirëve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? "border-blue-400 bg-blue-50" 
                      : file 
                      ? "border-green-400 bg-green-50" 
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="text-green-700 font-medium">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600">
                        Tërhiqni skedarin CSV këtu ose klikoni për të zgjedhur
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={!file || loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Duke importuar...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importo Mysafirët
                      </>
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/guests/export">
                      <Download className="h-4 w-4 mr-2" />
                      Shkarko Shembull
                    </Link>
                  </Button>
                </div>
              </form>

              {/* Result */}
              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}>
                        {result.success ? "Importimi u krye me sukses!" : "Gabim gjatë importimit"}
                      </p>
                      {result.success && result.count !== undefined && (
                        <p className="text-green-700 text-sm mt-1">
                          {result.count} mysafirë u shtuan në listë
                        </p>
                      )}
                      {!result.success && (
                        <p className="text-red-700 text-sm mt-1 whitespace-pre-wrap">
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Udhëzime për CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Format i kërkuar:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                    Emri,Mbiemri,Email,Telefoni,Adresa,Lloji,Kufizime Ushqimore,+1 Lejohet,Emri i +1,Statusi RSVP,Grupi
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vlerat e lejuara:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Lloji:</strong> adult, child, infant</li>
                    <li><strong>+1 Lejohet:</strong> Po, Jo</li>
                    <li><strong>Statusi RSVP:</strong> pending, attending, not_attending, maybe</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Këshilla:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Shkarkoni një shembull CSV nga sistemi</li>
                    <li>• Sigurohuni që skedari është në format UTF-8</li>
                    <li>• Fushat e zbrazëta do të mbushen me vlera të paracaktuara</li>
                    <li>• Kontrolloni të dhënat para importimit</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
