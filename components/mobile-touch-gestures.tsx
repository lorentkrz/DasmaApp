"use client"

import { useEffect, useRef } from "react"

interface TouchGesturesProps {
  onPinch?: (scale: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  children: React.ReactNode
  className?: string
}

export function MobileTouchGestures({ 
  onPinch, 
  onPan, 
  onTap, 
  onDoubleTap, 
  children, 
  className = "" 
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTouchDistance = useRef<number>(0)
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastTapTime = useRef<number>(0)
  const tapTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isGesturing = false

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0
      const touch1 = touches[0]
      const touch2 = touches[1]
      return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
    }

    const getTouchCenter = (touches: TouchList) => {
      if (touches.length === 0) return { x: 0, y: 0 }
      if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY }
      
      const touch1 = touches[0]
      const touch2 = touches[1]
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - potential tap
        const touch = e.touches[0]
        const now = Date.now()
        
        if (tapTimeout.current) {
          clearTimeout(tapTimeout.current)
          tapTimeout.current = undefined
        }

        if (now - lastTapTime.current < 300) {
          // Double tap detected
          onDoubleTap?.(touch.clientX, touch.clientY)
          lastTapTime.current = 0
        } else {
          // Single tap - wait to see if it becomes a double tap
          tapTimeout.current = setTimeout(() => {
            onTap?.(touch.clientX, touch.clientY)
          }, 300)
          lastTapTime.current = now
        }
      } else if (e.touches.length === 2) {
        // Multi-touch gesture
        isGesturing = true
        lastTouchDistance.current = getTouchDistance(e.touches)
        lastTouchCenter.current = getTouchCenter(e.touches)
        
        if (tapTimeout.current) {
          clearTimeout(tapTimeout.current)
          tapTimeout.current = undefined
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      
      if (e.touches.length === 1 && !isGesturing) {
        // Single finger pan
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastTouchCenter.current.x
        const deltaY = touch.clientY - lastTouchCenter.current.y
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          onPan?.(deltaX, deltaY)
          lastTouchCenter.current = { x: touch.clientX, y: touch.clientY }
        }
      } else if (e.touches.length === 2) {
        // Pinch gesture
        const currentDistance = getTouchDistance(e.touches)
        const currentCenter = getTouchCenter(e.touches)
        
        if (lastTouchDistance.current > 0) {
          const scale = currentDistance / lastTouchDistance.current
          onPinch?.(scale)
        }
        
        // Pan with two fingers
        const deltaX = currentCenter.x - lastTouchCenter.current.x
        const deltaY = currentCenter.y - lastTouchCenter.current.y
        
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          onPan?.(deltaX, deltaY)
        }
        
        lastTouchDistance.current = currentDistance
        lastTouchCenter.current = currentCenter
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isGesturing = false
        lastTouchDistance.current = 0
        lastTouchCenter.current = { x: 0, y: 0 }
      } else if (e.touches.length === 1) {
        // Reset for remaining single touch
        const touch = e.touches[0]
        lastTouchCenter.current = { x: touch.clientX, y: touch.clientY }
        lastTouchDistance.current = 0
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current)
      }
    }
  }, [onPinch, onPan, onTap, onDoubleTap])

  return (
    <div 
      ref={containerRef} 
      className={`touch-none select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  )
}
