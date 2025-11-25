import { useRef, useEffect, useCallback } from 'react'
import { audioAnalyzer } from '../services/audioAnalyzer'
import type { MoodAnalysis, MoodType } from '../types'
import './RealTimeVisualizer.css'

interface RealTimeVisualizerProps {
  mood: MoodAnalysis
  isActive: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#FFD700',
  sad: '#4169E1',
  calm: '#90EE90',
  energetic: '#FF6347',
  angry: '#DC143C'
}

const MOOD_COLORS_RGB: Record<MoodType, { r: number; g: number; b: number }> = {
  happy: { r: 255, g: 215, b: 0 },
  sad: { r: 65, g: 105, b: 225 },
  calm: { r: 144, g: 238, b: 144 },
  energetic: { r: 255, g: 99, b: 71 },
  angry: { r: 220, g: 20, b: 60 }
}

export default function RealTimeVisualizer({ mood, isActive }: RealTimeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  const moodColor = MOOD_COLORS[mood.mood]
  const moodRgb = MOOD_COLORS_RGB[mood.mood]

  // Create particles based on audio amplitude
  const emitParticles = useCallback((amplitude: number, centerX: number, centerY: number) => {
    const count = Math.floor(amplitude * 5 * mood.intensity)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (0.5 + Math.random() * 2) * (1 + mood.speed)

      // Mood-based particle behavior
      let vx = Math.cos(angle) * speed
      let vy = Math.sin(angle) * speed

      switch (mood.mood) {
        case 'happy':
          vy -= Math.random() * 2 // Upward bias
          break
        case 'sad':
          vy += Math.random() * 1.5 // Downward drift
          vx *= 0.5
          break
        case 'calm':
          vx *= 0.3
          vy *= 0.3
          break
        case 'energetic':
          vx *= 2
          vy *= 2
          break
        case 'angry':
          vx += (Math.random() - 0.5) * 4
          vy += (Math.random() - 0.5) * 4
          break
      }

      particlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 50,
        vx,
        vy,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        size: 2 + Math.random() * 4 * mood.intensity,
        color: moodColor,
        alpha: 0.8 + Math.random() * 0.2
      })
    }

    // Limit particle count
    if (particlesRef.current.length > 200) {
      particlesRef.current = particlesRef.current.slice(-200)
    }
  }, [mood, moodColor])

  // Update and render particles
  const updateParticles = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    const dt = deltaTime / 16 // Normalize to ~60fps

    particlesRef.current = particlesRef.current.filter(p => {
      // Update position
      p.x += p.vx * dt
      p.y += p.vy * dt

      // Apply gravity based on mood
      if (mood.mood === 'sad') {
        p.vy += 0.02 * dt
      } else if (mood.mood === 'happy') {
        p.vy -= 0.01 * dt
      }

      // Friction
      p.vx *= 0.99
      p.vy *= 0.99

      // Age particle
      p.life -= (1 / p.maxLife) * dt

      return p.life > 0
    })

    // Draw particles
    particlesRef.current.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, ${p.alpha * p.life})`
      ctx.fill()
    })
  }, [mood, moodRgb])

  // Main animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(26, 26, 46, 0.15)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const baseRadius = 60

    // Get audio data
    const waveform = audioAnalyzer.getWaveform()
    const frequencies = audioAnalyzer.getFrequencies()
    const amplitude = audioAnalyzer.getAmplitude()
    const peak = audioAnalyzer.getPeak()

    // Emit particles on sound
    if (amplitude > 0.01) {
      emitParticles(amplitude, centerX, centerY)
    }

    // Draw frequency spectrum bars at bottom
    const barWidth = canvas.width / frequencies.length
    const maxBarHeight = canvas.height * 0.25

    for (let i = 0; i < frequencies.length; i++) {
      const value = Math.max(0, (frequencies[i] + 100) / 100)
      const barHeight = value * maxBarHeight * mood.intensity

      const gradient = ctx.createLinearGradient(
        0, canvas.height - barHeight,
        0, canvas.height
      )
      gradient.addColorStop(0, `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, 0.8)`)
      gradient.addColorStop(1, `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, 0.2)`)

      ctx.fillStyle = gradient
      ctx.fillRect(
        i * barWidth + 1,
        canvas.height - barHeight,
        barWidth - 2,
        barHeight
      )
    }

    // Draw waveform ring around center
    ctx.beginPath()
    ctx.strokeStyle = `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, 0.6)`
    ctx.lineWidth = 2

    for (let i = 0; i < waveform.length; i++) {
      const angle = (i / waveform.length) * Math.PI * 2
      const waveRadius = baseRadius + waveform[i] * 50 * mood.intensity
      const x = centerX + Math.cos(angle) * waveRadius
      const y = centerY + Math.sin(angle) * waveRadius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()

    // Draw center orb with glow
    const orbRadius = baseRadius * (0.8 + peak * 0.4 * mood.intensity)

    // Glow effect
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbRadius * 2
    )
    glowGradient.addColorStop(0, `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, ${0.3 + amplitude * 0.5})`)
    glowGradient.addColorStop(0.5, `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, 0.1)`)
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()

    // Main orb
    const orbGradient = ctx.createRadialGradient(
      centerX - orbRadius * 0.3, centerY - orbRadius * 0.3, 0,
      centerX, centerY, orbRadius
    )
    orbGradient.addColorStop(0, `rgba(${Math.min(255, moodRgb.r + 50)}, ${Math.min(255, moodRgb.g + 50)}, ${Math.min(255, moodRgb.b + 50)}, 0.9)`)
    orbGradient.addColorStop(0.7, `rgba(${moodRgb.r}, ${moodRgb.g}, ${moodRgb.b}, 0.8)`)
    orbGradient.addColorStop(1, `rgba(${Math.max(0, moodRgb.r - 30)}, ${Math.max(0, moodRgb.g - 30)}, ${Math.max(0, moodRgb.b - 30)}, 0.6)`)

    ctx.beginPath()
    ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2)
    ctx.fillStyle = orbGradient
    ctx.fill()

    // Update and draw particles
    updateParticles(ctx, deltaTime)

    if (isActive) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [mood, moodRgb, isActive, emitParticles, updateParticles])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Start/stop animation
  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, animate])

  return (
    <div className="realtime-visualizer">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div className="mood-label">
        {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}
      </div>
    </div>
  )
}
