"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileTouchGestures } from "./mobile-touch-gestures"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Users, 
  Circle,
  Square,
  Smartphone,
  MousePointer
} from "lucide-react"

interface EnhancedSeatingChartProps {
  tables: any[]
  guests: any[]
  onTableUpdate: (tableId: string, updates: any) => void
  onGuestUpdate: (guestId: string, updates: any) => void
}

export function EnhancedSeatingChart({ 
  tables, 
  guests, 
  onTableUpdate, 
  onGuestUpdate 
}: EnhancedSeatingChartProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobileMode, setIsMobileMode] = useState(false)
  
  const chartRef = useRef<HTMLDivElement>(null)

  const handlePinch = useCallback((scale: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev * scale)))
  }, [])

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPan(prev => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom
    }))
  }, [zoom])

  const handleTap = useCallback((x: number, y: number) => {
    // Handle single tap - select table or guest
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const chartX = (x - rect.left - pan.x) / zoom
    const chartY = (y - rect.top - pan.y) / zoom
    
    // Find clicked table
    const clickedTable = tables.find(table => {
      const tableX = table.position_x || 0
      const tableY = table.position_y || 0
      const tableSize = table.table_type === 'round' ? 120 : 140
      
      return chartX >= tableX && chartX <= tableX + tableSize &&
             chartY >= tableY && chartY <= tableY + tableSize
    })
    
    setSelectedTable(clickedTable?.id || null)
  }, [tables, pan, zoom])

  const handleDoubleTap = useCallback((x: number, y: number) => {
    // Double tap to zoom in/out
    const newZoom = zoom > 1.5 ? 1 : 2
    setZoom(newZoom)
  }, [zoom])

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedTable(null)
  }

  const zoomIn = () => setZoom(prev => Math.min(3, prev * 1.2))
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.2))

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Move className="h-5 w-5" />
              Kontrollet e Planit
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isMobileMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMobileMode(!isMobileMode)}
                className="flex items-center gap-2"
              >
                {isMobileMode ? <Smartphone className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
                {isMobileMode ? "Touch Mode" : "Mouse Mode"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {Math.round(zoom * 100)}%
              </Badge>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Rreth</span>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Drejtkëndore</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Chart Container */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-xl">
        <CardContent className="p-0">
          <MobileTouchGestures
            onPinch={isMobileMode ? handlePinch : undefined}
            onPan={isMobileMode ? handlePan : undefined}
            onTap={isMobileMode ? handleTap : undefined}
            onDoubleTap={isMobileMode ? handleDoubleTap : undefined}
            className="relative w-full h-[600px] overflow-hidden"
          >
            <div
              ref={chartRef}
              className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0),
                  linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
                  linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%)
                `,
                backgroundSize: '12px 12px, 24px 24px, 24px 24px',
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              {/* Render Tables */}
              {tables.map((table) => {
                const tableGuests = guests.filter(g => g.table_id === table.id)
                const isSelected = selectedTable === table.id
                
                return (
                  <div
                    key={table.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-4 ring-blue-400 ring-opacity-60' : ''
                    }`}
                    style={{
                      left: table.position_x || 0,
                      top: table.position_y || 0,
                      width: table.table_type === 'round' ? 120 : 140,
                      height: table.table_type === 'round' ? 120 : 100,
                    }}
                    onClick={() => setSelectedTable(table.id)}
                  >
                    {/* Table Shape */}
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        table.table_type === 'round' 
                          ? 'from-blue-100 to-blue-200 rounded-full border-4 border-blue-300' 
                          : 'from-green-100 to-green-200 rounded-lg border-4 border-green-300'
                      } shadow-lg hover:shadow-xl transition-all flex items-center justify-center`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg text-gray-800">
                          {table.table_number}
                        </div>
                        <div className="text-xs text-gray-600">
                          {tableGuests.length}/{table.capacity}
                        </div>
                      </div>
                    </div>
                    
                    {/* Seat Positions for Rectangular Tables */}
                    {table.table_type === 'rectangular' && (
                      <>
                        {/* Top side - 2 seats */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {[0, 1].map(seatIndex => {
                            const guest = tableGuests[seatIndex]
                            return (
                              <div
                                key={`top-${seatIndex}`}
                                className={`w-6 h-6 rounded-full border-2 ${
                                  guest 
                                    ? 'bg-green-400 border-green-600' 
                                    : 'bg-gray-200 border-gray-400'
                                } shadow-sm`}
                                title={guest?.name || 'Vend i lirë'}
                              />
                            )
                          })}
                        </div>
                        
                        {/* Left side - 2 seats */}
                        <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                          {[2, 3].map(seatIndex => {
                            const guest = tableGuests[seatIndex]
                            return (
                              <div
                                key={`left-${seatIndex}`}
                                className={`w-6 h-6 rounded-full border-2 ${
                                  guest 
                                    ? 'bg-green-400 border-green-600' 
                                    : 'bg-gray-200 border-gray-400'
                                } shadow-sm`}
                                title={guest?.name || 'Vend i lirë'}
                              />
                            )
                          })}
                        </div>
                        
                        {/* Right side - 2 seats */}
                        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                          {[4, 5].map(seatIndex => {
                            const guest = tableGuests[seatIndex]
                            return (
                              <div
                                key={`right-${seatIndex}`}
                                className={`w-6 h-6 rounded-full border-2 ${
                                  guest 
                                    ? 'bg-green-400 border-green-600' 
                                    : 'bg-gray-200 border-gray-400'
                                } shadow-sm`}
                                title={guest?.name || 'Vend i lirë'}
                              />
                            )
                          })}
                        </div>
                        
                        {/* Bottom side - 2 seats */}
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {[6, 7].map(seatIndex => {
                            const guest = tableGuests[seatIndex]
                            return (
                              <div
                                key={`bottom-${seatIndex}`}
                                className={`w-6 h-6 rounded-full border-2 ${
                                  guest 
                                    ? 'bg-green-400 border-green-600' 
                                    : 'bg-gray-200 border-gray-400'
                                } shadow-sm`}
                                title={guest?.name || 'Vend i lirë'}
                              />
                            )
                          })}
                        </div>
                      </>
                    )}
                    
                    {/* Seat Positions for Round Tables */}
                    {table.table_type === 'round' && (
                      <>
                        {Array.from({ length: table.capacity }, (_, index) => {
                          const angle = (index / table.capacity) * 2 * Math.PI - Math.PI / 2
                          const radius = 65
                          const x = Math.cos(angle) * radius
                          const y = Math.sin(angle) * radius
                          const guest = tableGuests[index]
                          
                          return (
                            <div
                              key={`seat-${index}`}
                              className={`absolute w-6 h-6 rounded-full border-2 ${
                                guest 
                                  ? 'bg-blue-400 border-blue-600' 
                                  : 'bg-gray-200 border-gray-400'
                              } shadow-sm transform -translate-x-1/2 -translate-y-1/2`}
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                              }}
                              title={guest?.name || 'Vend i lirë'}
                            />
                          )
                        })}
                      </>
                    )}
                  </div>
                )
              })}
              
              {/* Unassigned Guests */}
              <div className="absolute top-4 right-4 max-w-xs">
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Mysafirë pa Vend ({guests.filter(g => !g.table_id).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-40 overflow-y-auto">
                    {guests.filter(g => !g.table_id).slice(0, 5).map(guest => (
                      <div
                        key={guest.id}
                        className="p-2 bg-gray-100 rounded-lg text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                        draggable
                      >
                        {guest.name}
                        {guest.plus_one && <span className="text-gray-500"> +1</span>}
                      </div>
                    ))}
                    {guests.filter(g => !g.table_id).length > 5 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{guests.filter(g => !g.table_id).length - 5} më shumë...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </MobileTouchGestures>
        </CardContent>
      </Card>

      {/* Mobile Instructions */}
      {isMobileMode && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <strong>Touch Gestures:</strong> Pinch to zoom • Drag to pan • Tap to select • Double-tap to reset zoom
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Details Panel */}
      {selectedTable && (
        <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tables.find(t => t.id === selectedTable)?.table_type === 'round' ? (
                <Circle className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 text-green-600" />
              )}
              Tavolina {tables.find(t => t.id === selectedTable)?.table_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Kapaciteti</label>
                  <div className="text-lg font-bold">
                    {tables.find(t => t.id === selectedTable)?.capacity} vende
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Të zënë</label>
                  <div className="text-lg font-bold">
                    {guests.filter(g => g.table_id === selectedTable).length} mysafirë
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Mysafirët</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {guests.filter(g => g.table_id === selectedTable).map(guest => (
                    <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                      <span className="text-sm font-medium">{guest.name}</span>
                      {guest.plus_one && (
                        <Badge variant="secondary" className="text-xs">+1</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
