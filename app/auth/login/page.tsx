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
import { Lock, Mail, Heart } from "lucide-react"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-amber-50 relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23d6d3d1%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2253%22%20cy%3D%2253%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      {/* Floating floral elements */}
      <div className="absolute top-8 left-8 w-16 h-16 opacity-20 animate-pulse">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="16" r="4" fill="#E8B4CB"/>
          <circle cx="24" cy="24" r="3" fill="#F5E6A3"/>
          <circle cx="40" cy="28" r="2" fill="#C8A2C8"/>
          <path d="M20 40 Q32 35 44 40 Q40 50 32 48 Q24 50 20 40" fill="#A8B5A0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="absolute top-16 right-12 w-12 h-12 opacity-15 animate-pulse" style={{animationDelay: '1s'}}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="12" r="3" fill="#F0E68C"/>
          <circle cx="16" cy="20" r="2" fill="#E8B4CB"/>
          <circle cx="32" cy="24" r="2.5" fill="#C8A2C8"/>
          <path d="M12 32 Q24 28 36 32 Q32 40 24 38 Q16 40 12 32" fill="#B8C5B0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-md sm:max-w-lg lg:max-w-xl mx-auto px-6 py-8 min-h-screen flex items-center">
        <div className="w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-stone-200/30 overflow-hidden">
            <div className="relative p-8 pb-6 text-center bg-gradient-to-b from-stone-50/50 to-white">
              
              {/* Heart Symbol */}
              <div className="mb-6">
                <div className="text-5xl text-black">
                  ♥
                </div>
              </div>
              
              <div className="space-y-6">
                <h1 className={`${dancingScript.className} text-4xl md:text-5xl font-medium text-stone-700`}>
                  Planifikuesi i Dasmave
                </h1>
                
                <p className={`${cormorant.className} text-lg md:text-xl text-stone-600 leading-relaxed max-w-md mx-auto`}>
                  Hyni në llogarinë tuaj për të organizuar dasmën e ëndrrave
                </p>
              </div>
            </div>

            <div className="p-8 pt-6">
              <div className="text-center mb-8">
                <h2 className={`${cormorant.className} text-2xl md:text-3xl font-semibold text-stone-800 mb-2`}>
                  Mirë se u ktheve
                </h2>
                <p className={`${cormorant.className} text-stone-600`}>
                  Vendosni të dhënat tuaja për të hyrë në sistem
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className={`${cormorant.className} text-stone-700 font-medium flex items-center gap-2`}>
                      <Mail className="h-4 w-4 text-stone-500" />
                      Adresa e Email-it
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="shembull@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl border-stone-200 focus:border-stone-400 focus:ring-stone-400 py-3 text-base bg-white/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className={`${cormorant.className} text-stone-700 font-medium flex items-center gap-2`}>
                        <Lock className="h-4 w-4 text-stone-500" />
                        Fjalëkalimi
                      </Label>
                      <Link href="/auth/forgot-password" className={`${cormorant.className} text-sm text-stone-600 hover:text-stone-700 hover:underline font-medium`}>
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
                      className="rounded-xl border-stone-200 focus:border-stone-400 focus:ring-stone-400 py-3 text-base bg-white/70"
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className={`${cormorant.className} text-sm text-rose-700 font-medium`}>{error}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className={`${cormorant.className} w-full rounded-2xl font-semibold py-4 text-lg bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 shadow-xl transform hover:scale-105 transition-all duration-300`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
