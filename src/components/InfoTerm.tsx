"use client"
import { useEffect, useRef, useState } from "react"

export function InfoTerm({ children, text, plain }: { children: React.ReactNode; text: string; plain?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [open])

  // Copia estática usada al capturar las gráficas para el PDF: sin interacción ni subrayado punteado.
  if (plain) return <span>{children}</span>

  return (
    <span ref={ref} className="relative inline-block group">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="underline decoration-dotted decoration-[#B8562E]/50 underline-offset-4 cursor-help
                   hover:decoration-[#B8562E] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#B8562E]/50 rounded-sm"
      >
        {children}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[240px]
                   rounded-lg bg-[#2B2620] px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-warm-xl
                   transition-opacity duration-150 whitespace-normal
                   ${open ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-[#2B2620]" />
      </span>
    </span>
  )
}
