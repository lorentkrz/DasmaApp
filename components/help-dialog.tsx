"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, QrCode, MessageSquare, Users, Wallet, ClipboardList } from "lucide-react"

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Step({ n, title, children, icon }: { n: number; title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--card-bg)] dark:bg-[color:var(--card-bg-dark)] border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] text-xs font-semibold">
          {n}
        </span>
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
      </div>
      <div className="text-[13px] leading-6 text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
        {children}
      </div>
    </div>
  )
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ndihmë & Udhëzues</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]">
            Menaxhoni mysafirë, ftesa, buxhet, shitës, detyra dhe ulëset – shpejt dhe qartë.
          </div>

          <Step n={1} title="Lidhu me WhatsApp (e para)" icon={<QrCode className="h-4 w-4" />}>
            <ul className="list-disc ml-5 space-y-1">
              <li>Hapni <Badge variant="outline" className="align-middle">Dashboard → WhatsApp</Badge> dhe klikoni <b>“Lidhu me WhatsApp”</b>.</li>
              <li>Skanojeni QR me telefonin tuaj; prisni statusin <b>CONNECTED</b>.</li>
              <li>Mbajeni telefonin të lidhur me internet dhe WhatsApp të hapur në sfond.</li>
            </ul>
          </Step>

          <Step n={2} title="Dërgoni ftesat" icon={<MessageSquare className="h-4 w-4" />}>
            <ul className="list-disc ml-5 space-y-1">
              <li>Shkoni te <Badge variant="outline">Dashboard → Ftesat</Badge> dhe krijoni/zgjedhni ftesat.</li>
              <li>Përdorni butonin <b>“Dërgo”</b> pranë mysafirëve – sistemi dërgon automatikisht nga WhatsApp juaj personal.</li>
              <li>Nëse statusi s’ndryshon, kontrolloni lidhjen në faqen WhatsApp dhe rifreskoni.</li>
            </ul>
          </Step>

          <Step n={3} title="Menaxhoni mysafirët & grupet" icon={<Users className="h-4 w-4" />}>
            <ul className="list-disc ml-5 space-y-1">
              <li>“+ Shto Mysafir” për shtim të shpejtë; modalet lejojnë ndryshime në vend.</li>
              <li>Për ftesë në grup: aktivizoni “Ftesë në Grup”, shtoni anëtarët dhe ruani marrëdhëniet.</li>
              <li>Statuset e RSVP: Vjen, S’vjen, Në pritje – përditësohen automatikisht nga ftesat.</li>
            </ul>
          </Step>

          <Step n={4} title="Buxheti, shpenzimet dhe shitësit" icon={<Wallet className="h-4 w-4" />}>
            <ul className="list-disc ml-5 space-y-1">
              <li>Shtoni shpenzim: përshkrim, shumë, datë, kategori, shitës, shënime.</li>
              <li>Shënoni si <b>depozitë</b> që të lidhet me shitësin dhe të reflektohet në statistika.</li>
            </ul>
          </Step>

          <Step n={5} title="Detyrat & Ulëset" icon={<ClipboardList className="h-4 w-4" />}>
            <ul className="list-disc ml-5 space-y-1">
              <li>Detyrat: krijoni, caktoni prioritet, kontrolloni progresin.</li>
              <li>Ulëset: vendosni tavolinat, tërhiqni-mbingarkoni mysafirë, ruani pozicionet.</li>
            </ul>
          </Step>

          <div className="rounded-md border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] p-3 text-[13px]">
            <div className="font-medium mb-1">Cilësime të shpejta të UI</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Gjuha: butonat <b>AL/EN</b> lart në topbar (ruhet automatikisht).</li>
              <li>Densiteti: <b>Comfortable/Compact</b> lart në topbar – ndikon në të gjithë aplikacionin.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
