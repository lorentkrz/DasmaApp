"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, Mail, Sparkles, Heart } from "lucide-react"

interface InvitationTemplate {
  id: string
  wedding_id: string
  name: string
  template_type: string
  subject: string
  message_template: string
  is_default: boolean
  created_at?: string
}

interface InvitationTemplateFormProps {
  weddingId: string
  template?: InvitationTemplate
}

export function InvitationTemplateForm({ weddingId, template }: InvitationTemplateFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<InvitationTemplate>({
    name: template?.name || "",
    template_type: template?.template_type || "rsvp",
    subject: template?.subject || "",
    message_template: template?.message_template || "",
    is_default: template?.is_default || false
  })
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        wedding_id: weddingId
      }

      if (template?.id) {
        // Update existing template
        const { error } = await supabase
          .from("invitation_templates")
          .update(data)
          .eq("id", template.id)
        
        if (error) throw error
        
        toast({
          title: "Shablloni u përditësua!",
          description: "Shablloni i ftesës u përditësua me sukses.",
        })
      } else {
        // Create new template
        const { error } = await supabase
          .from("invitation_templates")
          .insert([data])
        
        if (error) throw error
        
        toast({
          title: "Shablloni u krijua!",
          description: "Shablloni i ri i ftesës u krijua me sukses.",
        })
      }

      setOpen(false)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Gabim",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTemplates = {
    rsvp: {
      subject: "Ju jeni të ftuar në dasmën tonë! 💕",
      message: "Të dashur {guest_name},\n\nDo të ishim të nderuar që ju të jeni pjesë e ditës sonë të veçantë!\n\nData: {wedding_date}\nVendi: {venue}\nKoha: {ceremony_time}\n\nJu lutemi konfirmoni pjesëmarrjen tuaj duke klikuar në lidhjen më poshtë:\n{invitation_link}\n\nMe dashuri,\n{bride_name} & {groom_name}"
    },
    save_the_date: {
      subject: "Ruani datën - {wedding_date} 💒",
      message: "Të dashur {guest_name},\n\nRuani datën për dasmën tonë!\n\n{wedding_date}\n{venue}\n\nFtesa zyrtare do t'ju dërgohet së shpejti.\n\nMe dashuri,\n{bride_name} & {groom_name}"
    },
    thank_you: {
      subject: "Faleminderit për pjesëmarrjen! 🙏",
      message: "Të dashur {guest_name},\n\nFaleminderit shumë që ishit pjesë e ditës sonë të veçantë! Prania juaj e bëri dasmën tonë edhe më të bukur.\n\nMe mirënjohje të thellë,\n{bride_name} & {groom_name}"
    }
  }

  const handleTemplateTypeChange = (type: "rsvp" | "save_the_date" | "thank_you") => {
    setFormData(prev => ({
      ...prev,
      template_type: type,
      subject: prev.subject || defaultTemplates[type].subject,
      message_template: prev.message_template || defaultTemplates[type].message
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          {template ? "Përditëso Shabllonin" : "Shto Shabllon"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-pink-500" />
            {template ? "Përditëso Shabllonin e Ftesës" : "Krijo Shabllon të Ri"}
            <Sparkles className="h-4 w-4 text-amber-500" />
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Emri i Shabllonit</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="p.sh. Ftesa Kryesore"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_type">Lloji i Shabllonit</Label>
              <Select 
                value={formData.template_type} 
                onValueChange={handleTemplateTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rsvp">RSVP - Konfirmim Pjesëmarrjeje</SelectItem>
                  <SelectItem value="save_the_date">Save the Date - Ruani Datën</SelectItem>
                  <SelectItem value="thank_you">Thank You - Faleminderit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Titulli i Mesazhit</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Titulli i email-it ose mesazhit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message_template">Përmbajtja e Mesazhit</Label>
            <Textarea
              id="message_template"
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              placeholder="Shkruani mesazhin tuaj këtu..."
              rows={8}
              required
            />
            <div className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Variablat e disponueshme:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>• {"{guest_name}"} - Emri i mysafirit</span>
                <span>• {"{wedding_date}"} - Data e dasmës</span>
                <span>• {"{venue}"} - Vendi i dasmës</span>
                <span>• {"{ceremony_time}"} - Koha e ceremonisë</span>
                <span>• {"{bride_name}"} - Emri i nuses</span>
                <span>• {"{groom_name}"} - Emri i dhëndrit</span>
                <span>• {"{invitation_link}"} - Lidhja e ftesës</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_default" className="text-sm">
              Përdore si shabllon të parazgjedhur për këtë lloj ftese
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulo
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              {loading ? "Duke ruajtur..." : template ? "Përditëso" : "Krijo"}
              <Heart className="h-4 w-4 ml-2" fill="currentColor" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
