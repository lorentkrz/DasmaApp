"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Users, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  MapPin, 
  Mail, 
  Heart, 
  Plus, 
  TrendingUp, 
  Clock,
  Target,
  Sparkles,
  MessageCircle,
  Gift,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Utensils,
  Smartphone,
  Brain,
  Palette
} from "lucide-react"

interface ModernStatsProps {
  guestStats: any
  taskStats: any
  budgetStats: any
  vendorStats: any
  currentWedding: any
}

export function ModernDashboardStats({ guestStats, taskStats, budgetStats, vendorStats, currentWedding }: ModernStatsProps) {
  const completionRate = Math.round((taskStats.completed / Math.max(taskStats.total, 1)) * 100)
  const budgetUsed = Math.round((budgetStats.spent / Math.max(budgetStats.total, 1)) * 100)
  
  return (
    <div className="space-y-8">
      {/* Hero Stats with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 opacity-50"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Mysafirët</CardTitle>
            <div className="p-2 bg-blue-100/80 rounded-xl backdrop-blur-sm">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {guestStats.confirmed}/{guestStats.total}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {Math.round((guestStats.confirmed / Math.max(guestStats.total, 1)) * 100)}% konfirmuar
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-400/20 opacity-50"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Detyrat</CardTitle>
            <div className="p-2 bg-emerald-100/80 rounded-xl backdrop-blur-sm">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-800 mb-2">
              {taskStats.completed}/{taskStats.total}
            </div>
            <Progress value={completionRate} className="h-2 mb-2" />
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              {completionRate}% përfunduar
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 opacity-50"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Buxheti</CardTitle>
            <div className="p-2 bg-amber-100/80 rounded-xl backdrop-blur-sm">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-800 mb-2">
              €{budgetStats.spent.toLocaleString()}
            </div>
            <Progress value={budgetUsed} className="h-2 mb-2" />
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              {budgetUsed}% shpenzuar
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-purple-400/20 opacity-50"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700">Shitës</CardTitle>
            <div className="p-2 bg-violet-100/80 rounded-xl backdrop-blur-sm">
              <Heart className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-violet-800 mb-2">
              {vendorStats.confirmed}/{vendorStats.total}
            </div>
            <Badge className="bg-violet-100 text-violet-700 border-violet-200">
              {Math.round((vendorStats.confirmed / Math.max(vendorStats.total, 1)) * 100)}% konfirmuar
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200 shadow-lg hover:shadow-xl transition-all group cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Sugjerime
                </h3>
                <p className="text-sm text-cyan-600">Optimizoni planin e uljes automatikisht</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <Button asChild className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <Link href="/dashboard/seating">
                <Brain className="h-4 w-4 mr-2" />
                Shiko Sugjerime
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200 shadow-lg hover:shadow-xl transition-all group cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-rose-800 mb-2 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  WhatsApp Masiv
                </h3>
                <p className="text-sm text-rose-600">Dërgoni ftesa të gjithë mysafirëve</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-full group-hover:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <Button asChild className="w-full mt-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
              <Link href="/dashboard/invitations">
                <MessageCircle className="h-4 w-4 mr-2" />
                Dërgo Ftesa
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200 shadow-lg hover:shadow-xl transition-all group cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analitika Avancuar
                </h3>
                <p className="text-sm text-indigo-600">Shikoni trendet dhe insights</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <Button asChild className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
              <Link href="/dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Shiko Raportet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
