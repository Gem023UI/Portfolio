import { useEffect, useState } from 'react'
import './LoadingScreen.css'

const MIN_DURATION_MS = 3000
const FADE_MS = 600

interface LoadingScreenProps {
  onDone: () => void
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [leaving, setLeaving] = useState(false)

  // Lock scroll while the screen is up
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Wait for BOTH the 3s minimum and the window load, then fade out
  useEffect(() => {
    const minTimer = new Promise<void>((resolve) =>
      window.setTimeout(resolve, MIN_DURATION_MS),
    )
    const pageLoaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve()
      else window.addEventListener('load', () => resolve(), { once: true })
    })

    let fadeTimer: number | undefined
    let cancelled = false

    Promise.all([minTimer, pageLoaded]).then(() => {
      if (cancelled) return
      setLeaving(true)
      fadeTimer = window.setTimeout(onDone, FADE_MS)
    })

    return () => {
      cancelled = true
      if (fadeTimer) window.clearTimeout(fadeTimer)
    }
  }, [onDone])

  return (
    <div
      className={`loading-screen${leaving ? ' loading-screen--leaving' : ''}`}
      role="status"
      aria-live="polite"
    >
      <p className="loading-screen__text">
        Great design comes from curiosity. And you&apos;re right where you need to
        be. Name&apos;s Jem, welcome aboard.
      </p>
    </div>
  )
}