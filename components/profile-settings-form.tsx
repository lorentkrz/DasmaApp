'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProfileSettingsFormProps {
  user: any
  profile: any
}

export function ProfileSettingsForm({ user, profile }: ProfileSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || ''
  })
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Profili u përditësua!",
        description: "Të dhënat e profilit u ruajtën me sukses.",
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të përditësojmë profilin. Provoni përsëri.",
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
          <User className="h-5 w-5 text-slate-600" />
          Profili im
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Emri i plotë</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Shkruani emrin tuaj të plotë"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoni</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+383 XX XXX XXX"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
