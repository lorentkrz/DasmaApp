"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface Table {
  id: string
  table_number: number
  table_name: string | null
  capacity: number
  table_type: string
  position_x: number
  position_y: number
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  plus_one_name: string | null
  table_assignment: string | null
}

interface PDFExportButtonProps {
  tables: Table[]
  guests: Guest[]
  weddingName: string
}

export function PDFExportButton({ tables, guests, weddingName }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    setIsExporting(true)
    
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      // Get table assignments
      const getTableGuests = (tableId: string) => {
        return guests.filter(g => g.table_assignment === tableId)
      }

      // Generate HTML content - one table per page with beautiful design
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Seating Chart - ${weddingName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', sans-serif;
              background: linear-gradient(135deg, #fdf2f8 0%, #fef7ff 50%, #fff7ed 100%);
              color: #1f2937;
              line-height: 1.6;
            }
            
            .page {
              width: 210mm;
              height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              page-break-after: always;
              position: relative;
              overflow: hidden;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .decorative-bg {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              opacity: 0.03;
              background: radial-gradient(circle at 20% 80%, #ec4899 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, #f59e0b 0%, transparent 50%);
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              position: relative;
              z-index: 1;
            }
            
            .wedding-title {
              font-family: 'Playfair Display', serif;
              font-size: 32px;
              font-weight: 600;
              background: linear-gradient(135deg, #ec4899, #8b5cf6, #f59e0b);
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 8px;
            }
            
            .subtitle {
              font-size: 16px;
              color: #6b7280;
              font-weight: 400;
            }
            
            .table-container {
              position: relative;
              z-index: 1;
              background: linear-gradient(135deg, #fef7ff, #fdf2f8);
              border-radius: 24px;
              padding: 32px;
              border: 2px solid transparent;
              background-clip: padding-box;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              margin-bottom: 32px;
            }
            
            .table-header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 20px;
              border-bottom: 2px solid #f3e8ff;
            }
            
            .table-title {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              font-weight: 600;
              color: #7c3aed;
              margin-bottom: 8px;
            }
            
            .table-info {
              display: flex;
              justify-content: center;
              gap: 24px;
              margin-top: 12px;
            }
            
            .info-badge {
              background: linear-gradient(135deg, #ec4899, #8b5cf6);
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
            }
            
            .guests-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin-top: 24px;
            }
            
            .guest-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              transition: all 0.3s ease;
            }
            
            .guest-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            }
            
            .guest-name {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 4px;
            }
            
            .plus-one {
              font-size: 14px;
              color: #8b5cf6;
              font-weight: 500;
            }
            
            .empty-table {
              text-align: center;
              padding: 40px;
              color: #9ca3af;
              font-style: italic;
              background: linear-gradient(135deg, #f9fafb, #f3f4f6);
              border-radius: 16px;
              border: 2px dashed #d1d5db;
            }
            
            .footer {
              position: absolute;
              bottom: 20mm;
              left: 20mm;
              right: 20mm;
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
            }
            
            @media print {
              body { background: white !important; }
              .page { 
                box-shadow: none;
                margin: 0;
                width: 100%;
                height: 100vh;
              }
            }
          </style>
        </head>
        <body>
          ${tables.map((table, index) => {
            const tableGuests = getTableGuests(table.id)
            return `
              <div class="page">
                <div class="decorative-bg"></div>
                
                <div class="header">
                  <div class="wedding-title">${weddingName}</div>
                  <div class="subtitle">Plani i Uljes • Tavolina ${table.table_number}</div>
                </div>
                
                <div class="table-container">
                  <div class="table-header">
                    <div class="table-title">
                      Tavolina ${table.table_number}
                      ${table.table_name ? ` - ${table.table_name}` : ''}
                    </div>
                    <div class="table-info">
                      <span class="info-badge">${table.table_type === 'round' ? 'Rreth' : 'Drejtkëndore'}</span>
                      <span class="info-badge">${tableGuests.length}/${table.capacity} Vende</span>
                    </div>
                  </div>
                  
                  ${tableGuests.length === 0 ? `
                    <div class="empty-table">
                      <div style="font-size: 18px; margin-bottom: 8px;">🪑</div>
                      <div>Asnjë mysafir i caktuar për këtë tavolinë</div>
                    </div>
                  ` : `
                    <div class="guests-grid">
                      ${tableGuests.map(guest => `
                        <div class="guest-card">
                          <div class="guest-name">${guest.first_name || ''} ${guest.last_name || ''}</div>
                          ${guest.plus_one_name ? `<div class="plus-one">+ ${guest.plus_one_name}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
                
                <div class="footer">
                  Gjeneruar më ${new Date().toLocaleDateString('sq-AL')} • Faqja ${index + 1} nga ${tables.length}
                </div>
              </div>
            `
          }).join('')}
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
    } catch (error) {
      console.error('PDF export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      onClick={exportToPDF}
      disabled={isExporting}
      variant="outline" 
      className="bg-white/80 backdrop-blur-sm hover:bg-white border-purple-200 rounded-xl"
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Duke eksportuar...' : 'Eksporto PDF'}
    </Button>
  )
}
