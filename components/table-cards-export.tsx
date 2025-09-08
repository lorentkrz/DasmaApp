"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface TableCardsExportProps {
  tables: any[]
  guests: any[]
  weddingName: string
}

export function TableCardsExport({ tables, guests, weddingName }: TableCardsExportProps) {
  const exportTableCards = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        @page { size: A4; margin: 10mm; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #2d3748;
          line-height: 1.45;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          margin: 0 auto;
          background: white;
          page-break-after: always;
          display: flex;
          flex-wrap: wrap;
          gap: 8mm; /* slightly smaller gap to avoid overflow */
          align-content: flex-start;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .table-card {
          width: calc(50% - 4mm);
          height: 128mm; /* 2 * 128 + 8 gap + 20 padding = 284mm (<297) */
          background: white;
          border: 2px solid #e8d4c1;
          border-radius: 8px;
          padding: 12mm 10mm; /* reduce padding to help fit */
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .table-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3mm;
          background: linear-gradient(90deg, #d4a574, #c19a6b, #b8956a);
        }
        
        .card-header {
          text-align: center;
          margin-bottom: 6mm;
          padding-top: 2mm;
        }
        
        .table-title {
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size: 28px;
          font-weight: 700;
          color: #5a4a3a;
          margin-bottom: 2mm;
        }
        
        .table-number {
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size: 16px;
          font-weight: 400;
          color: #6b5d54;
          margin-bottom: 2mm;
        }
        
        .decorative-divider {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4a574, transparent);
          margin: 0 auto 4mm;
        }
        
        .guests-list {
          flex: 1;
          overflow: hidden;
        }
        
        .guest-name {
          font-size: 16px;
          color: #374151;
          padding: 2.2mm 0;
          text-align: center;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        
        .guest-name.with-plus-one {
          font-weight: 500;
        }
        
        .plus-one-name {
          font-size: 13px;
          color: #718096;
          font-style: italic;
          margin-left: 10px;
        }
        
        .empty-table {
          text-align: center;
          color: #a0aec0;
          font-style: italic;
          padding: 10mm 0;
        }
        
        .card-footer {
          text-align: center;
          margin-top: 5mm;
          padding-top: 3mm;
          border-top: 1px solid #e8d4c1;
        }
        
        .capacity-info {
          font-size: 12px;
          color: #718096;
        }
        
        /* Alternative elegant design for variety */
        .table-card:nth-child(even) .table-title {
          font-family: 'Playfair Display', serif;
          color: #6b5d54;
        }
        
        .table-card:nth-child(even)::before {
          background: linear-gradient(90deg, #c19a6b, #b8956a, #a68660);
        }
        
        @media print {
          body { background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { margin: 0 !important; width: 100% !important; height: 100vh !important; }
          .table-card { break-inside: avoid; }
        }
      </style>
    `

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kartelat e Tavolinave - ${weddingName}</title>
          ${styles}
        </head>
        <body>
    `

    // Sort tables by table number
    const sortedTables = [...tables].sort((a, b) => a.table_number - b.table_number)
    
    // Group tables into pages (4 cards per page - 2x2 layout)
    const tablesPerPage = 4
    const pages = []
    for (let i = 0; i < sortedTables.length; i += tablesPerPage) {
      pages.push(sortedTables.slice(i, i + tablesPerPage))
    }

    pages.forEach((pageTables, pageIndex) => {
      htmlContent += '<div class="page">'
      
      pageTables.forEach((table) => {
        const tableGuests = guests.filter(g => g.table_assignment === table.id)
        
        htmlContent += `
          <div class="table-card">
            <div class="card-header">
              <h2 class="table-title">${table.table_name || `Tavolina`}</h2>
              <div class="decorative-divider"></div>
            </div>
            
            <div class="guests-list">
              ${tableGuests.length > 0 ? 
                tableGuests.map(guest => {
                  let guestDisplay = `<div class="guest-name${guest.plus_one_name ? ' with-plus-one' : ''}">`
                  guestDisplay += `${guest.first_name} ${guest.last_name}`
                  if (guest.plus_one_name) {
                    guestDisplay += `<span class="plus-one-name">& ${guest.plus_one_name}</span>`
                  }
                  guestDisplay += '</div>'
                  return guestDisplay
                }).join('') : 
                '<div class="empty-table">Tavolinë e rezervuar</div>'
              }
            </div>
            
            <div class="card-footer">
              <p class="capacity-info">Kapaciteti: ${table.capacity} vende</p>
            </div>
          </div>
        `
      })
      
      htmlContent += '</div>'
    })

    htmlContent += `
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print()
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }, 500)

    toast.success("Kartelat e tavolinave u krijuan me sukses!")
  }

  return (
    <Button 
      onClick={exportTableCards}
      variant="outline"
      className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
    >
      <Printer className="h-4 w-4 mr-2" />
      Printo Kartelat
    </Button>
  )
}
