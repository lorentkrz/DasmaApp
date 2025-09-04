'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function NotificationSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    email_notifications: true,
    task_notifications: true,
    rsvp_notifications: true
  })
  
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement notification settings save
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Preferencat u ruajtën!",
        description: "Cilësimet e njoftimeve u përditësuan me sukses.",
      })
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të ruajmë preferencat. Provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Bell className="h-5 w-5 text-slate-600" />
          Njoftimet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Email njoftimet</p>
              <p className="text-sm text-gray-600">Merrni email për ngjarje të rëndësishme</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-slate-500 rounded" 
              checked={settings.email_notifications}
              onChange={(e) => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Njoftimet për detyra</p>
              <p className="text-sm text-gray-600">Njoftimet për detyrat që afrohen</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-slate-500 rounded" 
              checked={settings.task_notifications}
              onChange={(e) => setSettings(prev => ({ ...prev, task_notifications: e.target.checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Njoftimet për RSVP</p>
              <p className="text-sm text-gray-600">Njoftimet kur mysafirët konfirmojnë</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-slate-500 rounded" 
              checked={settings.rsvp_notifications}
              onChange={(e) => setSettings(prev => ({ ...prev, rsvp_notifications: e.target.checked }))}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Duke ruajtur...' : 'Ruaj preferencat'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
