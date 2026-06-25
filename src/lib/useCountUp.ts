"use client"
import { useEffect, useRef, useState } from "react"

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target)
  const prev = useRef(target)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (prev.current === target) return
    const from = prev.current
    const diff = target - from
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // easeOutExpo
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(from + diff * ease)
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
        prev.current = target
      }
    }

    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}
