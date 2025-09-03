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
import { Heart, Sparkles, Lock, Mail, User } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Fjalëkalimet nuk përputhen")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Fjalëkalimi duhet të jetë së paku 6 karaktere")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-amber-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-pink-200/25 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-rose-300/30 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      <div className="relative flex items-center justify-center p-4 md:p-6 min-h-screen">
        <div className="w-full max-w-lg">
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Enhanced Logo Section - Mobile Responsive */}
            <div className="text-center space-y-3 md:space-y-4">
              <div className="flex justify-center items-center mb-3 md:mb-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center shadow-xl">
                    <Heart className="h-8 w-8 md:h-10 md:w-10 text-white animate-pulse" fill="currentColor" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 md:h-6 md:w-6 text-amber-400 animate-bounce" />
                </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                Planifikuesi i Dasmave
              </h1>
              <p className="text-gray-600 text-base md:text-lg px-4">Filloni udhëtimin tuaj drejt dasmës së ëndrrave</p>
            </div>

            <Card className="rounded-2xl md:rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
              <CardHeader className="bg-gradient-to-r from-rose-100/50 to-pink-100/50 py-6 md:py-8 text-center">
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                  Krijoni Llogarinë Tuaj
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                </CardTitle>
                <CardDescription className="text-gray-600 text-base md:text-lg px-4">
                  Bashkohuni me ne për të planifikuar dasmën e përkryer
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="first-name" className="text-gray-700 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-rose-500" />
                        Emri
                      </Label>
                      <Input
                        id="first-name"
                        placeholder="Emri juaj"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="rounded-xl border-rose-200 focus:border-rose-400 focus:ring-rose-400 py-3 text-base"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="last-name" className="text-gray-700 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-rose-500" />
                        Mbiemri
                      </Label>
                      <Input
                        id="last-name"
                        placeholder="Mbiemri juaj"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="rounded-xl border-rose-200 focus:border-rose-400 focus:ring-rose-400 py-3 text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-rose-500" />
                      Adresa e Email-it
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="shembull@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl border-rose-200 focus:border-rose-400 focus:ring-rose-400 py-3 text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-rose-500" />
                      Fjalëkalimi
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Së paku 6 karaktere"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl border-rose-200 focus:border-rose-400 focus:ring-rose-400 py-3 text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="repeat-password" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-rose-500" />
                      Konfirmoni Fjalëkalimin
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      placeholder="Përsëritni fjalëkalimin"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                      className="rounded-xl border-rose-200 focus:border-rose-400 focus:ring-rose-400 py-3 text-base"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full rounded-2xl font-bold py-4 text-base md:text-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-xl transform hover:scale-105 transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Po krijohet llogaria...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                        Filloni Udhëtimin Tuaj
                      </div>
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm md:text-base px-4">
                    Keni tashmë një llogari?{' '}
                    <Link href="/auth/login" className="text-rose-600 hover:text-rose-700 font-semibold hover:underline">
                      Hyni në llogarinë tuaj
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
