"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, Save } from "lucide-react"

interface ProfileSettingsProps {
  user: any
  profile: any
  weddings: any[]
}

export function ProfileSettings({ user, profile, weddings }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || ""
  })
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq("id", user.id)
      
      if (error) throw error
      
      toast({
        title: "Profili u përditësua",
        description: "Të dhënat tuaja u ruajtën me sukses."
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të përditësohej profili.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Të Dhënat Personale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Emri i Plotë</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Emri dhe Mbiemri"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoni</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+383 44 123 456"
            />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {weddings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dasmat Tuaja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weddings.map((wedding) => (
                <div key={wedding.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{wedding.bride_name} & {wedding.groom_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(wedding.wedding_date).toLocaleDateString('sq-AL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
