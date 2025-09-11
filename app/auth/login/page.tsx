"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, Heart, Eye, EyeOff, Calendar, Gift, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [capsOn, setCapsOn] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ndodhi një gabim")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-rose-50 to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Watery glows with fresh accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-rose-200/45 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-200/25 blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
        {/* Hero panel */}
        <div className="hidden md:block">
          <div className="glass rounded-2xl p-8 border border-white/20 dark:border-slate-800/50 shadow-xl backdrop-blur-lg bg-white/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Heart className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Mirë se erdhët</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Menaxhoni çdo detaj të dasmës me stil dhe qetësi.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300/90">
              <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-600" /> Planifikim & afate</li>
              <li className="flex items-center gap-2"><Gift className="h-4 w-4 text-cyan-600" /> Dhurata & buxheti</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /> Ftesa elegante & RSVP</li>
            </ul>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-blue-300/60 via-indigo-300/50 to-rose-300/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)]">
          <Card className="w-full max-w-md md:max-w-none glass rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Heart className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Dasma ERP
                  </CardTitle>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Hyr për të vazhduar menaxhimin e dasmës</p>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="shembull@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-10 pl-10 bg-white/60 dark:bg-slate-800/50 border border-slate-200/40 dark:border-slate-700/40 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-300/60 focus-visible:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">Fjalëkalimi</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Shkruani fjalëkalimin tuaj"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={(e) => setCapsOn((e as any).getModifierState && (e as any).getModifierState('CapsLock'))}
                        onKeyUp={(e) => setCapsOn((e as any).getModifierState && (e as any).getModifierState('CapsLock'))}
                        required
                        className="h-10 pl-10 pr-10 bg-white/60 dark:bg-slate-800/50 border border-slate-200/40 dark:border-slate-700/40 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-300/60 focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded accent-indigo-500"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                        />
                        Më mbaj mend
                      </label>
                      <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:underline">E harruat fjalëkalimin?</Link>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full font-semibold py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-200/40 focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:outline-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Duke hyrë...
                    </div>
                  ) : (
                    "Kyçu"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-slate-500 dark:text-slate-400/90">
        © {new Date().getFullYear()} Dasma ERP
      </div>
    </div>
  )
}
