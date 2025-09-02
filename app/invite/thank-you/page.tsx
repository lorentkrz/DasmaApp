import { Heart, Sparkles, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function InviteThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 w-24 h-24 bg-rose-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-amber-200/40 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-24 left-1/3 w-28 h-28 bg-pink-200/25 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-rose-300/35 rounded-full blur-md animate-pulse delay-500"></div>
      </div>
      
      <div className="relative flex items-center justify-center p-6 min-h-screen">
        <div className="max-w-2xl w-full">
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
            <CardContent className="p-12 text-center space-y-8">
              {/* Success Icon */}
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="h-12 w-12 text-white" fill="currentColor" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-amber-400 animate-bounce" />
                  <Heart className="absolute -bottom-1 -left-1 h-6 w-6 text-rose-500 animate-pulse" fill="currentColor" />
                </div>
              </div>

              {/* Thank You Message */}
              <div className="space-y-6">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Faleminderit shumë!
                </h1>
                
                <div className="space-y-4">
                  <p className="text-2xl font-semibold text-gray-800">
                    Përgjigja juaj u regjistrua me sukses ✨
                  </p>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-xl mx-auto">
                    Jemi të lumtur që morët kohën për t'u përgjigjur. Presim me padurim të shohemi në këtë ditë të veçantë!
                  </p>
                </div>
              </div>

              {/* Decorative Quote */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
                </div>
                <p className="text-lg italic text-gray-700 font-medium">
                  "Dashuria është gjuha që zemra e kupton pa fjalë"
                </p>
                <p className="text-lg text-gray-700 mb-8">
                  Faleminderit që morët pjesë në dasmën tonë të veçantë!
                </p>
              </div>

              {/* Additional Message */}
              <div className="pt-6 border-t border-rose-200/50">
                <p className="text-gray-600 text-lg">
                  Nëse keni ndonjë pyetje, mos hezitoni të na kontaktoni.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Me dashuri dhe mirënjohje të thellë
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
