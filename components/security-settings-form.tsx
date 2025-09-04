'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SecuritySettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.new_password !== formData.confirm_password) {
      toast({
        title: "Gabim",
        description: "Fjalëkalimet e reja nuk përputhen.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement password change
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Fjalëkalimi u ndryshua!",
        description: "Fjalëkalimi juaj u përditësua me sukses.",
      })

      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të ndryshojmë fjalëkalimin. Provoni përsëri.",
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
          <Shield className="h-5 w-5 text-slate-600" />
          Siguria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Fjalëkalimi aktual</Label>
            <Input
              id="current_password"
              type="password"
              value={formData.current_password}
              onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
              placeholder="Shkruani fjalëkalimin aktual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">Fjalëkalimi i ri</Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
              placeholder="Shkruani fjalëkalimin e ri"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Konfirmoni fjalëkalimin</Label>
            <Input
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
              placeholder="Konfirmoni fjalëkalimin e ri"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Duke ndryshuar...' : 'Ndrysho fjalëkalimin'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
