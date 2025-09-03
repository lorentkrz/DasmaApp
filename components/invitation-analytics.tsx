"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mail, Users, CheckCircle, Clock, XCircle, Heart, Sparkles } from "lucide-react"

interface InvitationStats {
  total: number
  sent: number
  responded: number
  attending: number
  notAttending: number
  maybe: number
  pending: number
}

interface InvitationAnalyticsProps {
  stats: InvitationStats
}

export function InvitationAnalytics({ stats }: InvitationAnalyticsProps) {
  const responseRate = stats.sent > 0 ? (stats.responded / stats.sent) * 100 : 0
  const attendanceRate = stats.responded > 0 ? (stats.attending / stats.responded) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Invitations */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Gjithsej Ftesa
          </CardTitle>
          <Mail className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          <p className="text-xs text-blue-600 mt-1">
            Ftesa të krijuara
          </p>
        </CardContent>
      </Card>

      {/* Sent Invitations */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Ftesa të Dërguara
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{stats.sent}</div>
          <Progress 
            value={stats.total > 0 ? (stats.sent / stats.total) * 100 : 0} 
            className="mt-2 h-2"
          />
          <p className="text-xs text-green-600 mt-1">
            {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}% e të gjitha ftesave
          </p>
        </CardContent>
      </Card>

      {/* Response Rate */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Shkalla e Përgjigjeve
          </CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">
            {Math.round(responseRate)}%
          </div>
          <Progress value={responseRate} className="mt-2 h-2" />
          <p className="text-xs text-amber-600 mt-1">
            {stats.responded} nga {stats.sent} të dërguar
          </p>
        </CardContent>
      </Card>

      {/* Attendance Rate */}
      <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Shkalla e Pjesëmarrjes
          </CardTitle>
          <Heart className="h-4 w-4 text-rose-600" fill="currentColor" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700">
            {Math.round(attendanceRate)}%
          </div>
          <Progress value={attendanceRate} className="mt-2 h-2" />
          <p className="text-xs text-rose-600 mt-1">
            {stats.attending} do të vijnë
          </p>
        </CardContent>
      </Card>

      {/* Detailed Response Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-600" />
            Detajet e Përgjigjeve
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.attending}</div>
              <p className="text-sm text-gray-600">Do të vijnë</p>
            </div>
            
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-700">{stats.notAttending}</div>
              <p className="text-sm text-gray-600">Nuk vijnë</p>
            </div>
            
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-700">{stats.maybe}</div>
              <p className="text-sm text-gray-600">Ndoshta</p>
            </div>
            
            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
              <p className="text-sm text-gray-600">Pa përgjigjur</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
