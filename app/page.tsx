import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
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
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-stone-200/30 overflow-hidden p-12">
            
            {/* Heart Symbol */}
            <div className="mb-8">
              <div className="text-6xl text-black">
                ♥
              </div>
            </div>
            
            <div className="space-y-8">
              <h1 className={`${dancingScript.className} text-5xl md:text-6xl font-medium text-stone-700`}>
                Planifikuesi i Dasmave
              </h1>
              
              <p className={`${cormorant.className} text-xl md:text-2xl text-stone-600 leading-relaxed max-w-lg mx-auto`}>
                Organizoni dasmën e ëndrrave me sistemin tonë të menaxhimit
              </p>
              
              <div className="pt-6">
                <Button asChild size="lg" className={`${cormorant.className} text-lg px-12 py-4 rounded-2xl font-semibold bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 shadow-xl transform hover:scale-105 transition-all duration-300`}>
                  <Link href="/auth/login">Hyr në Sistem</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
