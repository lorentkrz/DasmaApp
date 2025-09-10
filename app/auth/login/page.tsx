"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/hooks/use-i18n"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }

      // Simple redirect without delays or extra checks
      router.push("/dashboard")
      router.refresh()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ndodhi një gabim")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--app-bg-2025)] dark:bg-[color:var(--app-bg-dark)]">
      <Card className="w-full max-w-md glass border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">Dasma ERP</CardTitle>
            <div className="flex items-center rounded-md border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] overflow-hidden bg-white dark:bg-slate-900">
              <button
                className={`px-2.5 h-8 text-xs ${locale === 'al' ? 'bg-white dark:bg-slate-900 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                onClick={() => setLocale('al')}
              >AL</button>
              <button
                className={`px-2.5 h-8 text-xs border-l border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] ${locale === 'en' ? 'bg-white dark:bg-slate-900 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                onClick={() => setLocale('en')}
              >EN</button>
            </div>
          </div>
          <p className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] mt-1">{t('auth.login.subtitle', 'Hyr për të vazhduar')}</p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-2 text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
                  <Mail className="h-4 w-4 text-[color:var(--muted-2025)]" /> {t('auth.email', 'Email')}
                </Label>
                <Input id="email" type="email" placeholder="shembull@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2 text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
                    <Lock className="h-4 w-4 text-[color:var(--muted-2025)]" /> {t('auth.password', 'Fjalëkalimi')}
                  </Label>
                  <Link href="/auth/forgot-password" className="text-xs text-[color:var(--muted-2025)] hover:text-[color:var(--text-2025)]">{t('auth.forgot', 'E harruat?')}</Link>
                </div>
                <Input id="password" type="password" placeholder={t('auth.password_placeholder', 'Shkruani fjalëkalimin tuaj')} value={password} onChange={e => setPassword(e.target.value)} required className="h-10" />
              </div>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-3"><p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p></div>}

            <Button type="submit" className="w-full font-semibold py-2.5 text-sm" disabled={isLoading}>
              {isLoading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{t('auth.signing_in', 'Duke hyrë...')}</div> : t('auth.sign_in', 'Kyçu')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
