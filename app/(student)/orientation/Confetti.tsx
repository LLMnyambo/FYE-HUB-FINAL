'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  progress: number
}

export default function Confetti({ progress }: Props) {
  useEffect(() => {
    if (progress !== 100) return

    const duration = 5000
    const animationEnd = Date.now() + duration

    const defaults = {
      startVelocity: 35,
      spread: 360,
      ticks: 80,
      zIndex: 9999,
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 60 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [progress])

  return null
}