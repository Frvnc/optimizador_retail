"use client"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { HelpCircle } from "lucide-react"

const POPOVER_WIDTH = 288 // w-72

export function SectionHelp({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(true)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeen(!!window.localStorage.getItem("section-help-seen"))
    const onSeen = () => setSeen(true)
    window.addEventListener("section-help-seen", onSeen)
    return () => window.removeEventListener("section-help-seen", onSeen)
  }, [])

  const place = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12)
    setPos({ top: rect.bottom + 8, left: Math.max(12, left) })
  }

  useEffect(() => {
    if (!open) return
    place()
    const onClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        popRef.current && !popRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    const onScrollOrResize = () => place()
    document.addEventListener("click", onClick)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      document.removeEventListener("click", onClick)
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [open])

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen((o) => !o)
    if (!seen) {
      setSeen(true)
      window.localStorage.setItem("section-help-seen", "1")
      window.dispatchEvent(new Event("section-help-seen"))
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Ayuda sobre esta sección"
        className={`relative inline-grid place-items-center h-5 w-5 rounded-full border transition-smooth
                   align-middle hover:scale-110 active:scale-95
                   ${open
                     ? "bg-[#B8562E] border-[#B8562E] text-white"
                     : "border-[#D8CFBC] text-[#8A8172] hover:border-[#B8562E] hover:text-[#B8562E]"}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {!seen && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-[#B8562E]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B8562E]" />
          </span>
        )}
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
          className="z-50 max-w-[85vw] rounded-xl border border-[#E8E1D2] bg-white/80 backdrop-blur-md p-4 shadow-warm-xl
                     text-xs text-[#5c5346] leading-relaxed space-y-2 animate-fade"
        >
          {children}
        </div>,
        document.body
      )}
    </>
  )
}
