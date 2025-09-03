"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #fdf2f8 0%, #fef3c7 50%, #fce7f3 100%);
          color: #1f2937;
          line-height: 1.6;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border-radius: 12px;
          page-break-after: always;
          position: relative;
          overflow: hidden;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8mm;
          background: linear-gradient(90deg, #f43f5e, #ec4899, #f59e0b);
        }
        
        .page::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4mm;
          background: linear-gradient(90deg, #f43f5e, #ec4899, #f59e0b);
        }
        
        .wedding-header {
          text-align: center;
          margin-bottom: 40px;
          padding-top: 15mm;
        }
        
        .wedding-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          background: linear-gradient(135deg, #be185d, #ec4899, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .wedding-date {
          font-size: 18px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 20px;
        }
        
        .decorative-line {
          width: 120px;
          height: 3px;
          background: linear-gradient(90deg, #f43f5e, #ec4899, #f59e0b);
          margin: 0 auto;
          border-radius: 2px;
        }
        
        .table-container {
          background: linear-gradient(135deg, #fef7ff 0%, #fef3c7 50%, #fdf2f8 100%);
          border-radius: 20px;
          padding: 35px;
          margin-bottom: 30px;
          border: 2px solid #f3e8ff;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .table-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #f43f5e, #ec4899, #f59e0b);
          border-radius: 22px;
          z-index: -1;
        }
        
        .table-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .table-number {
          <h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; color: #374151; text-align: center; margin-bottom: 0.5rem;">
            ${weddingName}
          </h1>
          font-size: 20px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 15px;
        }
        
        .table-name {
          font-size: 20px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 15px;
        }
        
        .table-type-badge {
          display: inline-block;
          padding: 8px 20px;
          background: linear-gradient(135deg, #ec4899, #f59e0b);
          color: white;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .guests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .guest-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          border: 2px solid #fce7f3;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .guest-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f43f5e, #ec4899, #f59e0b);
        }
        
        .guest-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .guest-details {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .plus-one-badge {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }
        
        .page-footer {
          position: absolute;
          bottom: 15mm;
          left: 25mm;
          right: 25mm;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }
        
        .empty-seats {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 30px;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px dashed #d1d5db;
        }
        
        @media print {
          body {
            background: white !important;
          }
          
          .page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
          }
        }
      </style>
    `

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Plani i Uljes - ${weddingName}</title>
          ${styles}
        </head>
        <body>
    `

    tables.forEach((table, index) => {
      const tableGuests = guests.filter(g => g.table_id === table.id)
      const tableTypeName = table.table_type === 'round' ? 'Rreth' : 'Drejtkëndore'
      
      htmlContent += `
        <div class="page">
          <div class="wedding-header">
            <h1 class="wedding-title">${weddingName}</h1>
            <p class="wedding-date">${new Date().toLocaleDateString('sq-AL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <div class="decorative-line"></div>
          </div>
          
          <div class="table-container">
            <div class="table-header">
              <h2 class="table-number">Tavolina ${table.table_number}</h2>
              <p class="table-name">${table.name || `Tavolina ${table.table_number}`}</p>
              <span class="table-type-badge">${tableTypeName}</span>
            </div>
            
            ${tableGuests.length > 0 ? `
              <div class="guests-grid">
                ${tableGuests.map(guest => `
                  <div class="guest-card">
                    <div class="guest-name">${guest.first_name} ${guest.last_name}</div>
                    <div class="guest-details">
                      <span>Mysafir ${guest.guest_type || 'i rregullt'}</span>
                      ${guest.plus_one ? '<span class="plus-one-badge">+1</span>' : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-seats">
                <p>Kjo tavolinë është ende e lirë</p>
                <p>Kapaciteti: ${table.capacity} vende</p>
              </div>
            `}
          </div>
          
          <div class="page-footer">
            <p>Plani i Uljes • Faqja ${index + 1} nga ${tables.length} • Krijuar më ${new Date().toLocaleDateString('sq-AL')}</p>
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
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print()
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }, 500)

    toast.success("PDF u krijua me sukses!")
  }

  return (
    <Button 
      onClick={exportToPDF}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <Download className="h-5 w-5 mr-2" />
      Export PDF
    </Button>
  )
}
