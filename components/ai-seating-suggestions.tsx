"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, Heart, Zap } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Guest {
  id: string
  first_name: string
  last_name: string
  plus_one_name: string | null
  table_assignment: string | null
  guest_type: string
  dietary_restrictions: string | null
}

interface Table {
  id: string
  table_number: number
  capacity: number
  table_type: string
}

interface AISeatingProps {
  guests: Guest[]
  tables: Table[]
  weddingId: string
  onSuggestionsApplied: () => void
}

export function AISeatingsuggestions({ guests, tables, weddingId, onSuggestionsApplied }: AISeatingProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const supabase = createClient()

  const generateSuggestions = async () => {
    setIsGenerating(true)
    
    try {
      // AI-powered seating algorithm
      const unassignedGuests = guests.filter(g => !g.table_assignment)
      const availableTables = tables.filter(t => {
        const assignedCount = guests.filter(g => g.table_assignment === t.id).length
        return assignedCount < t.capacity
      })

      const newSuggestions = []
      
      // Group families and couples together
      const adultGuests = unassignedGuests.filter(g => g.guest_type === 'adult')
      const childGuests = unassignedGuests.filter(g => g.guest_type === 'child')
      
      // Smart assignment logic
      for (const table of availableTables) {
        const currentCapacity = guests.filter(g => g.table_assignment === table.id).length
        const availableSeats = table.capacity - currentCapacity
        
        if (availableSeats > 0) {
          const tableGuests = []
          
          // Prioritize adults with plus ones
          const guestsWithPlusOnes = adultGuests.filter(g => g.plus_one_name)
          for (const guest of guestsWithPlusOnes.slice(0, Math.floor(availableSeats / 2))) {
            tableGuests.push(guest)
            adultGuests.splice(adultGuests.indexOf(guest), 1)
          }
          
          // Fill remaining seats with adults
          const remainingSeats = availableSeats - tableGuests.length * 2
          for (const guest of adultGuests.slice(0, remainingSeats)) {
            tableGuests.push(guest)
          }
          
          if (tableGuests.length > 0) {
            newSuggestions.push({
              tableId: table.id,
              tableNumber: table.table_number,
              guests: tableGuests,
              reason: tableGuests.some(g => g.plus_one_name) ? 
                "Çifte dhe familje së bashku" : 
                "Mysafirë të rritur"
            })
          }
        }
      }
      
      setSuggestions(newSuggestions)
      toast.success("Sugjerime të gjeneruara me sukses!")
      
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error("Gabim në gjenerimin e sugjerimeve")
    } finally {
      setIsGenerating(false)
    }
  }

  const applySuggestions = async () => {
    try {
      const updates = []
      
      for (const suggestion of suggestions) {
        for (const guest of suggestion.guests) {
          updates.push({
            id: guest.id,
            table_assignment: suggestion.tableId
          })
        }
      }
      
      for (const update of updates) {
        await supabase
          .from('guests')
          .update({ table_assignment: update.table_assignment })
          .eq('id', update.id)
      }
      
      setSuggestions([])
      onSuggestionsApplied()
      toast.success("Sugjerime të aplikuara me sukses!")
      
    } catch (error) {
      console.error('Error applying suggestions:', error)
      toast.error("Gabim në aplikimin e sugjerimeve")
    }
  }

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-800">
          <Sparkles className="h-5 w-5" />
          Sugjerime AI për Uljen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Duke gjeneruar...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gjeneroni Sugjerime
              </>
            )}
          </Button>
          
          {suggestions.length > 0 && (
            <Button 
              onClick={applySuggestions}
              variant="outline"
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Apliko Sugjerime
            </Button>
          )}
        </div>
        
        {suggestions.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white/80 rounded-lg p-3 border border-violet-200">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-violet-300 text-violet-700">
                    Tavolina {suggestion.tableNumber}
                  </Badge>
                  <span className="text-xs text-violet-600">{suggestion.reason}</span>
                </div>
                <div className="text-sm space-y-1">
                  {suggestion.guests.map((guest: any) => (
                    <div key={guest.id} className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-violet-500" />
                      <span>{guest.first_name} {guest.last_name}</span>
                      {guest.plus_one_name && (
                        <span className="text-violet-600">+ {guest.plus_one_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
