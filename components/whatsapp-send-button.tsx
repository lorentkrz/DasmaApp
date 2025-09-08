"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WhatsAppSendButtonProps {
  invitationId: string
  guestName: string
  phone: string
  isSent: boolean
}

export function WhatsAppSendButton({ invitationId, guestName, phone, isSent }: WhatsAppSendButtonProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(isSent)
  const { toast } = useToast()

  const handleSend = async () => {
    setSending(true)
    try {
      const response = await fetch(`/dashboard/invitations/send/${invitationId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setSent(true)
        toast({
          title: "Ftesa u dërgua!",
          description: `Ftesa për ${guestName} u dërgua me sukses në WhatsApp.`,
        })
        // Refresh the page to update the UI
        window.location.reload()
      } else {
        throw new Error(data.error || "Failed to send invitation")
      }
    } catch (error: any) {
      toast({
        title: "Gabim në dërgim",
        description: error.message.includes("WhatsApp") 
          ? "Sigurohuni që WhatsApp është i lidhur në faqen e konfigurimit."
          : `Gabim: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Button variant="outline" disabled className="bg-green-50 border-green-200 text-green-700">
        <CheckCircle className="h-4 w-4 mr-2" />
        E Dërguar
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleSend}
      disabled={sending || !phone}
      aria-busy={sending}
      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
    >
      {sending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Duke dërguar...
        </>
      ) : (
        <>
          <Send className="h-4 w-4 mr-2" />
          Dërgo
        </>
      )}
    </Button>
  )
}
