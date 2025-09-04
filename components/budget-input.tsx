'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface BudgetInputProps {
  wedding: any
}

export function BudgetInput({ wedding }: BudgetInputProps) {
  const [budget, setBudget] = useState(wedding.total_budget?.toString() || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    if (!budget || parseFloat(budget) < 0) {
      toast({
        title: "Gabim",
        description: "Ju lutem vendosni një buxhet të vlefshëm.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('weddings')
        .update({ total_budget: parseFloat(budget) })
        .eq('id', wedding.id)

      if (error) throw error

      toast({
        title: "Buxheti u ruajt!",
        description: `Buxheti total i dasmës u vendos në €${parseFloat(budget).toLocaleString()}.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating budget:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të ruajmë buxhetin. Provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Buxheti Total i Dasmës
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Shuma totale që planifikoni të shpenzoni</Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Duke ruajtur...' : 'Ruaj'}
            </Button>
          </div>
        </div>
        
        {wedding.total_budget > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              Buxheti aktual: <span className="font-semibold">€{Number(wedding.total_budget).toLocaleString()}</span>
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          Ky është buxheti total që planifikoni të shpenzoni për dasmën tuaj. 
          Mund ta ndryshoni këtë në çdo kohë.
        </p>
      </CardContent>
    </Card>
  )
}
