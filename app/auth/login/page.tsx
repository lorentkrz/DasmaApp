"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Lock, Mail, Calendar } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-slate-200/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-gray-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-stone-200/25 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-slate-300/30 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      <div className="relative flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-lg">
          <div className="flex flex-col gap-8">
            {/* Enhanced Logo Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center shadow-xl">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-gray-700 to-slate-600 bg-clip-text text-transparent">
                Planifikuesi i Dasmave
              </h1>
              <p className="text-gray-600 text-lg">Hyni në llogarinë tuaj për të organizuar dasmën e ëndrrave</p>
            </div>

            <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
              <CardHeader className="bg-gradient-to-r from-slate-100/50 to-gray-100/50 py-8 text-center">
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Mirë se u ktheve
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Vendosni të dhënat tuaja për të hyrë në sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      Adresa e Email-it
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="shembull@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400 py-3"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700 font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4 text-slate-500" />
                        Fjalëkalimi
                      </Label>
                      <Link href="/auth/forgot-password" className="text-sm text-slate-600 hover:text-slate-700 hover:underline font-medium">
                        E harruat fjalëkalimin?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Shkruani fjalëkalimin tuaj"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400 py-3"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full rounded-2xl font-bold py-4 text-lg bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-xl transform hover:scale-105 transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Po hyjmë në sistem...
                      </div>
                    ) : (
                      "Hyr në Sistem"
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Nuk keni llogari ende?{' '}
                    <Link href="/auth/sign-up" className="text-slate-600 hover:text-slate-700 font-semibold hover:underline">
                      Krijoni një llogari të re
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
