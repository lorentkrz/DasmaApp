"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface BeautifulPDFExportProps {
  tables: any[]
  guests: any[]
  weddingName: string
}

export function BeautifulPDFExport({ tables, guests, weddingName }: BeautifulPDFExportProps) {
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        @page { size: A4; margin: 0; }
        /* Use system fonts for sharper print rendering */

        * { margin:0; padding:0; box-sizing:border-box; }

        body {
          font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background:#fff;
          color:#4B3F3F;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width:210mm;
          height:297mm;
          display:flex;
          justify-content:center;
          align-items:center;
          padding:20mm;
          background: linear-gradient(135deg, #fff7f2, #fff9f6);
        }

        .table-card {
          width:100%;
          max-width:170mm;
          min-height:250mm;
          background:#fff;
          border-radius:40px;
          padding:50px 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          position:relative;
          overflow:hidden;
        }

        /* Floral accents */
        .floral-corner {
          position:absolute;
          width:120px;
          height:120px;
          opacity:0.1;
        }
        .floral-top-left { top:-10px; left:-10px; }
        .floral-bottom-right { bottom:-10px; right:-10px; }

        .table-title {
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size:64px;
          color:#C17C6A;
          margin-bottom:25px;
          text-align:center;
        }

        .divider {
          width:60%;
          height:2px;
          background:#E6C9B4;
          margin-bottom:35px;
          border-radius:2px;
        }

        /* Guest grid */
        .guests-list {
          display:grid;
          grid-template-columns: repeat(2, 1fr);
          gap:24px;
          width:100%;
          text-align:center;
          font-size:28px;
          margin-top:10px;
          font-weight:400;
        }

        .guest-name {
          font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #FFF5F0;
          border-radius:16px;
          padding:14px 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .plus-one {
          font-style:italic;
          color:#A08F82;
          margin-left:6px;
        }

        /* Empty seats */
        .empty-seats {
          font-style:italic;
          color:#A08F82;
          margin-top:25px;
          font-size:20px;
        }

        /* Black heart */
        .black-heart {
          font-size:48px;
          color:#000;
          position:absolute;
          bottom:20px;
        }

        @media print {
          body { background:#fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { box-shadow:none; margin:0; width:100%; height:100%; }
        }
      </style>
    `

    const floralSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#E6C9B4">
        <circle cx="32" cy="32" r="32"/>
      </svg>
    `

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${weddingName} - Plani i Uljes</title>
          ${styles}
        </head>
        <body>
    `

    tables
      .sort((a, b) => (a.table_number ?? 0) - (b.table_number ?? 0))
      .forEach(table => {
        const tableGuests = guests.filter(g => g.table_assignment === table.id)
        const tableTitle = table.table_name && table.table_name.trim().length > 0
          ? table.table_name
          : `Tavolina`

        htmlContent += `
          <div class="page">
            <div class="table-card">
              <div class="floral-corner floral-top-left">${floralSVG}</div>
              <div class="floral-corner floral-bottom-right">${floralSVG}</div>
              <div class="table-title">${tableTitle}</div>
              <div class="divider"></div>
              ${tableGuests.length > 0 ? `
                <div class="guests-list">
                  ${tableGuests.map(guest => `
                    <div class="guest-name">
                      ${guest.first_name} ${guest.last_name}${guest.plus_one_name ? `<span class="plus-one"> & ${guest.plus_one_name}</span>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="empty-seats">Pa mysafirë të caktuar – Kapaciteti ${table.capacity}</div>
              `}
              <div class="black-heart">♥</div>
            </div>
          </div>
        `
      })

    htmlContent += `
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    const doPrint = () => {
      try {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => printWindow.close(), 1200)
      } catch {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => printWindow.close(), 1200)
        }, 500)
      }
    }

    const fontsReady = (printWindow.document as any).fonts?.ready
    if (fontsReady && typeof fontsReady.then === 'function') {
      (printWindow.document as any).fonts.ready.then(() => setTimeout(doPrint, 200))
    } else {
      setTimeout(doPrint, 1000)
    }

    toast.success("PDF u krijua me sukses!")
  }

  return (
    <Button 
      onClick={exportToPDF}
      className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center"
    >
      <Download className="h-5 w-5 mr-2" />
      Export PDF
    </Button>
  )
}
