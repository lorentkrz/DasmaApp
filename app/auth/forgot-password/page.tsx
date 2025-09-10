"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowLeft, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Cormorant_Garamond } from "next/font/google"

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","700"] })

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setMessage("Emaili i rivendosjes është dërguar! Kontrolloni inbox-in tuaj.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ndodhi një gabim")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center opacity-10">
          <Heart className="h-[450px] w-[450px] text-rose-200" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className={`${cormorant.className} text-4xl font-bold text-gray-800 mb-4`}>Dasma ERP</h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Rivendosni fjalëkalimin tuaj për të vazhduar me organizimin e dasmës.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-2xl mx-6">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-rose-100 rounded-full">
                <Mail className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <CardTitle className={`${cormorant.className} text-3xl font-bold text-gray-800`}>Rivendos Fjalëkalimin</CardTitle>
            <p className="text-sm text-gray-500">Shkruani email-in tuaj dhe ne do t'ju dërgojmë një link për rivendosje</p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Mail className="h-4 w-4 text-rose-400" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="shembull@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="rounded-md border-rose-100 focus:border-rose-300 focus:ring-rose-200 bg-white"
                  />
                </div>
              </div>

              {error && <div className="bg-rose-50 border border-rose-200 rounded-md p-3"><p className="text-sm text-rose-700 font-medium">{error}</p></div>}

              {message && <div className="bg-green-50 border border-green-200 rounded-md p-3"><p className="text-sm text-green-700 font-medium">{message}</p></div>}

              <Button type="submit" className="w-full rounded-full font-semibold py-3 text-base bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md hover:shadow-lg" disabled={isLoading}>
                {isLoading ? <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Duke dërguar...</div> : "Dërgo Link-un e Rivendosjes"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-rose-600 hover:text-rose-700 hover:underline font-medium flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Kthehu në Kyçje
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
