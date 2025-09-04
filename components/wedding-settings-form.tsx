'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WeddingSettingsFormProps {
  wedding: any
}

export function WeddingSettingsForm({ wedding }: WeddingSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bride_name: wedding?.bride_name || '',
    groom_name: wedding?.groom_name || '',
    wedding_date: wedding?.wedding_date || '',
    venue_name: wedding?.venue_name || '',
    venue_address: wedding?.venue_address || '',
    guest_count_estimate: wedding?.guest_count_estimate?.toString() || '',
    budget: (wedding?.total_budget || wedding?.budget_total)?.toString() || '',
    status: wedding?.status || 'planning'
  })
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData = {
        bride_name: formData.bride_name,
        groom_name: formData.groom_name,
        wedding_date: formData.wedding_date,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        guest_count_estimate: formData.guest_count_estimate ? parseInt(formData.guest_count_estimate) : 0,
        status: formData.status,
        updated_at: new Date().toISOString()
      }

      // Add budget field (only use budget_total for now until migration runs)
      if (formData.budget) {
        const budgetValue = parseFloat(formData.budget);
        (updateData as any).budget_total = budgetValue;
      }

      console.log('Updating wedding with data:', updateData)
      console.log('Wedding ID:', wedding.id)
      
      const { error, data } = await supabase
        .from('weddings')
        .update(updateData)
        .eq('id', wedding.id)
        .select()
      
      console.log('Update result:', { error, data })

      if (error) throw error

      toast({
        title: "Cilësimet u ruajtën!",
        description: "Të dhënat e dasmës u përditësuan me sukses.",
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating wedding settings:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të ruajmë cilësimet. Provoni përsëri.",
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
          <Settings className="h-5 w-5 text-slate-600" />
          Cilësimet e Dasmës
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bride_name">Emri i nuses *</Label>
              <Input
                id="bride_name"
                value={formData.bride_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bride_name: e.target.value }))}
                placeholder="Emri i nuses"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom_name">Emri i dhëndrit *</Label>
              <Input
                id="groom_name"
                value={formData.groom_name}
                onChange={(e) => setFormData(prev => ({ ...prev, groom_name: e.target.value }))}
                placeholder="Emri i dhëndrit"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wedding_date">Data e dasmës *</Label>
              <Input
                id="wedding_date"
                type="date"
                value={formData.wedding_date}
                onChange={(e) => setFormData(prev => ({ ...prev, wedding_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statusi</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planifikim</SelectItem>
                  <SelectItem value="confirmed">Konfirmuar</SelectItem>
                  <SelectItem value="completed">Përfunduar</SelectItem>
                  <SelectItem value="cancelled">Anulluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_name">Emri i vendit</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
              placeholder="Emri i vendit të dasmës"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_address">Adresa e vendit</Label>
            <Input
              id="venue_address"
              value={formData.venue_address}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_address: e.target.value }))}
              placeholder="Adresa e plotë e vendit"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_count_estimate">Numri i mysafirëve (vlerësim)</Label>
              <Input
                id="guest_count_estimate"
                type="number"
                min="0"
                value={formData.guest_count_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_count_estimate: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Buxheti total i planifikuar (€)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget: e.target.value
                }))}
                placeholder="0.00"
              />
            </div>
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
