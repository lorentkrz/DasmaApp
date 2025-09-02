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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
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

        {/* WhatsApp Setup Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-100 via-emerald-50 to-teal-100 py-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">WhatsApp Konfigurimi</CardTitle>
                <CardDescription className="text-gray-600">
                  Lidhni WhatsApp-in tuaj për të dërguar ftesa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <WhatsAppSetup />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
