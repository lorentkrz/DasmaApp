"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Mail, 
  Sparkles, 
  Heart, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Check,
  FileText,
  MessageSquare,
  Calendar,
  MapPin,
  Clock,
  Users,
  Palette,
  Code,
  Smartphone,
  Send,
  Gift
} from "lucide-react"

interface InvitationTemplate {
  id?: string
  wedding_id: string
  name: string
  template_type: string
  subject: string
  message_template: string
  is_default?: boolean
  created_at?: string
}

interface InvitationTemplateEditorProps {
  weddingId: string
  templates?: InvitationTemplate[]
}

const templateTypes = [
  { label: "RSVP Ftesë", value: "rsvp", icon: <Mail className="h-4 w-4" /> },
  { label: "Ruaj Datën", value: "save_the_date", icon: <Calendar className="h-4 w-4" /> },
  { label: "Përkujtesë", value: "reminder", icon: <Clock className="h-4 w-4" /> },
  { label: "Falënderim", value: "thank_you", icon: <Heart className="h-4 w-4" /> }
]

const templateVariables = [
  { key: "{guest_name}", label: "Emri i Mysafirit", icon: <Users className="h-3 w-3" /> },
  { key: "{wedding_date}", label: "Data e Dasmës", icon: <Calendar className="h-3 w-3" /> },
  { key: "{venue}", label: "Vendi", icon: <MapPin className="h-3 w-3" /> },
  { key: "{ceremony_time}", label: "Koha e Ceremonisë", icon: <Clock className="h-3 w-3" /> },
  { key: "{invitation_link}", label: "Lidhja e Ftesës", icon: <Mail className="h-3 w-3" /> },
  { key: "{bride_name}", label: "Emri i Nuses", icon: <Heart className="h-3 w-3" /> },
  { key: "{groom_name}", label: "Emri i Dhëndrit", icon: <Heart className="h-3 w-3" /> }
]

const defaultTemplates = {
  rsvp: {
    name: "Ftesë Standarde",
    subject: "Ju jeni të ftuar në dasmën tonë! 💕",
    message: `Të dashur {guest_name},

Me shumë gëzim ju ftojmë të ndani me ne ditën më të bukur të jetës sonë!

📅 Data: {wedding_date}
📍 Vendi: {venue}
⏰ Koha: {ceremony_time}

Ju lutemi konfirmoni pjesëmarrjen tuaj duke klikuar në lidhjen më poshtë:
{invitation_link}

Presim me padurim të festojmë së bashku!

Me dashuri,
{bride_name} & {groom_name}`
  },
  save_the_date: {
    name: "Ruaj Datën",
    subject: "Ruani datën - {wedding_date} 💒",
    message: `Të dashur {guest_name},

Me gëzim të madh ju njoftojmë se do të martohemi!

📅 Ruani datën: {wedding_date}
📍 Vendi: {venue}

Ftesa zyrtare do të vijë së shpejti. Deri atëherë, ruani këtë datë të veçantë për ne!

Me dashuri,
{bride_name} & {groom_name}`
  },
  reminder: {
    name: "Përkujtesë",
    subject: "Përkujtesë - Dasma jonë është së shpejti! 🎊",
    message: `Të dashur {guest_name},

Ju përkujtojmë me dashuri se dasma jonë është vetëm disa ditë larg!

📅 Data: {wedding_date}
📍 Vendi: {venue}
⏰ Koha: {ceremony_time}

Nëse nuk e keni konfirmuar ende pjesëmarrjen, ju lutemi klikoni këtu:
{invitation_link}

Mezi presim t'ju shohim!

Me dashuri,
{bride_name} & {groom_name}`
  },
  thank_you: {
    name: "Falënderim",
    subject: "Faleminderit që ishit pjesë e ditës sonë! ❤️",
    message: `Të dashur {guest_name},

Nga thellësia e zemrës faleminderit që ishit pjesë e ditës sonë të veçantë!

Prania juaj e bëri dasmën tonë edhe më të paharrueshme. Jemi mirënjohës për dashurinë dhe mbështetjen tuaj.

Do të ruajmë përgjithmonë kujtimet e bukura të kësaj dite të mrekullueshme që ndamë së bashku.

Me dashuri dhe mirënjohje,
{bride_name} & {groom_name}`
  }
}

export function InvitationTemplateEditor({ weddingId, templates = [] }: InvitationTemplateEditorProps) {
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<InvitationTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvitationTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<InvitationTemplate>({
    wedding_id: weddingId,
    name: "",
    template_type: "rsvp",
    subject: "",
    message_template: ""
  })
  
  const { toast } = useToast()
  const supabase = createClient()

  const handleOpenDialog = (template?: InvitationTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData(template)
    } else {
      setEditingTemplate(null)
      setFormData({
        wedding_id: weddingId,
        name: "",
        template_type: "rsvp",
        subject: "",
        message_template: ""
      })
    }
    setOpen(true)
  }

  const handleSelectDefaultTemplate = (type: string) => {
    const template = defaultTemplates[type]
    if (template) {
      setFormData({
        ...formData,
        name: template.name,
        subject: template.subject,
        message_template: template.message
      })
    }
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('message-template') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.message_template
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      setFormData({
        ...formData,
        message_template: before + variable + after
      })
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 10)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingTemplate?.id) {
        const { error } = await supabase
          .from("invitation_templates")
          .update(formData)
          .eq("id", editingTemplate.id)
        
        if (error) throw error
        
        toast({
          title: "Shablloni u përditësua!",
          description: "Shablloni i ftesës u përditësua me sukses."
        })
      } else {
        const { error } = await supabase
          .from("invitation_templates")
          .insert([formData])
        
        if (error) throw error
        
        toast({
          title: "Shablloni u krijua!",
          description: "Shablloni i ri i ftesës u krijua me sukses."
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

  const handleDelete = async (templateId: string) => {
    if (!confirm("Jeni të sigurt që doni të fshini këtë shabllon?")) return

    try {
      const { error } = await supabase
        .from("invitation_templates")
        .delete()
        .eq("id", templateId)
      
      if (error) throw error
      
      toast({
        title: "Shablloni u fshi!",
        description: "Shablloni u fshi me sukses."
      })
      
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Gabim",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handlePreview = (template: InvitationTemplate) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }

  const renderPreview = (text: string) => {
    return text.replace(/{([^}]+)}/g, (match, key) => {
      const examples = {
        guest_name: "Agron & Albana Krasniqi",
        wedding_date: "15 Qershor 2024",
        venue: "Hotel Grand",
        ceremony_time: "18:00",
        invitation_link: "https://dasma-ime.com/ftesa/abc123",
        bride_name: "Albana",
        groom_name: "Agron"
      }
      return examples[key] || match
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <Card className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border-0">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Shabllonet e Ftesave</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Krijoni dhe personalizoni mesazhe të bukura për mysafirët tuaj
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Krijo Shabllon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const typeInfo = templateTypes.find(t => t.value === template.template_type)
            return (
              <Card key={template.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {typeInfo?.icon}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    {template.is_default && (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Parazgjedhur
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="w-fit mt-2">
                    {typeInfo?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Subjekti:</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Mesazhi:</p>
                      <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">
                        {template.message_template}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Shiko
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edito
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(template.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Nuk ka shabllone të krijuara ende
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Krijoni shabllone të personalizuara për ftesat tuaja
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Krijo Shabllon të Parë
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {editingTemplate ? "Edito Shabllon" : "Krijo Shabllon të Ri"}
            </DialogTitle>
            <DialogDesc>
              Personalizoni mesazhet e ftesave për mysafirët tuaj
            </DialogDesc>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Emri i Shabllonit</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="p.sh. Ftesë Kryesore"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Lloji i Shabllonit</Label>
                <StandardDropdown
                  value={formData.template_type}
                  onValueChange={(value) => {
                    const type = Array.isArray(value) ? value[0] : value
                    setFormData({ ...formData, template_type: type })
                    handleSelectDefaultTemplate(type)
                  }}
                  options={templateTypes.map(t => ({ label: t.label, value: t.value }))}
                  placeholder="Zgjidhni llojin"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subjekti i Emailit</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="p.sh. Ju jeni të ftuar në dasmën tonë!"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message-template">Mesazhi</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    Variablat
                  </Badge>
                </div>
              </div>
              
              {/* Variables Helper */}
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                {templateVariables.map((variable) => (
                  <Button
                    key={variable.key}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertVariable(variable.key)}
                    className="text-xs"
                  >
                    {variable.icon}
                    {variable.label}
                  </Button>
                ))}
              </div>

              <Textarea
                id="message-template"
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Shkruani mesazhin tuaj këtu..."
                className="min-h-[300px] font-mono text-sm"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Anulo
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Duke ruajtur..." : editingTemplate ? "Përditëso" : "Krijo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Parashiko Ftesën
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-rose-600" />
                    <p className="font-semibold text-gray-800">WhatsApp / SMS</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 shadow-inner">
                    <p className="font-semibold text-gray-900 mb-2">
                      {renderPreview(selectedTemplate.subject)}
                    </p>
                    <p className="text-gray-700 whitespace-pre-line text-sm">
                      {renderPreview(selectedTemplate.message_template)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-gray-800">Email</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg shadow-inner">
                    <div className="border-b px-4 py-2">
                      <p className="text-xs text-gray-500">Subjekti:</p>
                      <p className="font-semibold text-gray-900">
                        {renderPreview(selectedTemplate.subject)}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 whitespace-pre-line">
                        {renderPreview(selectedTemplate.message_template)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Mbyll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
