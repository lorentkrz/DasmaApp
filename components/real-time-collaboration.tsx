"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Eye, Edit3 } from "lucide-react"

interface CollaboratorActivity {
  user_id: string
  user_email: string
  action: string
  timestamp: string
  page: string
}

interface RealTimeCollaborationProps {
  weddingId: string
  currentPage: string
}

export function RealTimeCollaboration({ weddingId, currentPage }: RealTimeCollaborationProps) {
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [recentActivity, setRecentActivity] = useState<CollaboratorActivity[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Track current user activity
    const trackActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user presence
      await supabase
        .from('wedding_collaborators')
        .update({ 
          last_seen: new Date().toISOString(),
          current_page: currentPage 
        })
        .eq('wedding_id', weddingId)
        .eq('user_id', user.id)
    }

    trackActivity()
    const interval = setInterval(trackActivity, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [weddingId, currentPage, supabase])

  useEffect(() => {
    // Subscribe to real-time changes
    const channel = supabase
      .channel('wedding_collaboration')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wedding_collaborators',
        filter: `wedding_id=eq.${weddingId}`
      }, (payload) => {
        // Handle real-time collaboration updates
        // Update handled silently
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [weddingId, supabase])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-violet-200 rounded-2xl p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-gray-700">Bashkëpunim në Kohë Reale</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((userId, index) => (
              <Avatar key={userId} className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-gradient-to-r from-violet-400 to-purple-400 text-white text-xs">
                  {index + 1}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Badge variant="outline" className="border-violet-300 text-violet-700">
            <Eye className="h-3 w-3 mr-1" />
            {activeUsers.length} aktiv
          </Badge>
        </div>
        
        {recentActivity.length > 0 && (
          <div className="mt-3 pt-3 border-t border-violet-100">
            <div className="text-xs text-gray-500 space-y-1">
              {recentActivity.slice(0, 2).map((activity, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3 text-violet-500" />
                  <span>{activity.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
