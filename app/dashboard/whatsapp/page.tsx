import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WhatsAppSetup } from "@/components/whatsapp-setup"
import { MessageCircle, Smartphone, Heart, Sparkles, Zap } from "lucide-react"

export default async function WhatsAppPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-[var(--bg-dark)]">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                WhatsApp Konfigurimi
              </h1>
            </div>
            <p className="text-gray-600">
              Lidhni WhatsApp-in tuaj personal për të dërguar ftesa
            </p>
          </div>
        </div>

        {/* WhatsApp Setup Card (content only, no duplicate header) */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <WhatsAppSetup />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
