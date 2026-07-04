"use client"
import { useEffect, useState } from "react"
import { HelpCircle, X } from "lucide-react"

const TERMS: { term: string; short: string; detail: string }[] = [
  {
    term: "Precio óptimo (P*)",
    short: "El precio al que te conviene vender para ganar la mayor plata posible.",
    detail: "Se calcula donde la ganancia deja de subir y empieza a bajar (la derivada del beneficio es cero).",
  },
  {
    term: "Beneficio (B)",
    short: "La ganancia real: lo que entra por ventas menos todos los costos.",
    detail: "B(P) = Ingresos − Costos. B* es el beneficio en el precio óptimo.",
  },
  {
    term: "Elasticidad E(P)",
    short: "Qué tan sensibles son tus clientes a un cambio de precio.",
    detail: "Si |E| > 1 (elástica), subir el precio baja mucho las ventas. Si |E| < 1 (inelástica), casi no las afecta.",
  },
  {
    term: "R² (bondad de ajuste)",
    short: "Qué tan bien el modelo predice tus ventas reales.",
    detail: "Va de 0 a 1. Más cerca de 1 = la línea del modelo pasa muy cerca de tus datos reales.",
  },
  {
    term: "Banda de confianza 95%",
    short: "El rango donde muy probablemente caería la demanda real.",
    detail: "Es una franja alrededor de la línea del modelo: mientras más angosta, más segura es la predicción.",
  },
  {
    term: "Costo Fijo (CF)",
    short: "Gastos mensuales que no cambian según cuánto vendas.",
    detail: "Ej: arriendo, sueldos fijos. No afecta el precio óptimo, solo cuánto ganas en total.",
  },
  {
    term: "Costo Variable (cv)",
    short: "Lo que cuesta producir o comprar cada unidad.",
    detail: "Ej: insumos, embalaje. Si sube, el precio óptimo también sube.",
  },
  {
    term: "Punto de equilibrio (break-even)",
    short: "Los precios donde no ganas ni pierdes plata.",
    detail: "Por debajo o por encima de ese rango de precios, el negocio da pérdida.",
  },
  {
    term: "Derivada / Óptimo B'(P)=0",
    short: "La herramienta matemática que encuentra el punto más alto de la curva de beneficio.",
    detail: "Cuando la pendiente de B(P) es cero, esa es la cima de la curva: el precio óptimo.",
  },
]

export function GlossaryPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Glosario de términos"
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#E8E1D2] bg-white
                   text-[#8A8172] hover:text-[#B8562E] hover:border-[#B8562E]/40 transition-smooth shrink-0"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 animate-fade">
          <div
            className="absolute inset-0 bg-[#2B2620]/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#F7F2E9] border-l border-[#E8E1D2]
                            shadow-2xl overflow-y-auto animate-fade-up">
            <div className="sticky top-0 bg-[#F7F2E9]/95 backdrop-blur border-b border-[#E8E1D2] px-5 py-4
                            flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#2B2620]">Glosario</h2>
                <p className="text-xs text-[#8A8172]">Términos usados en la app, en palabras simples</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-lg text-[#8A8172] hover:text-[#A6453D] hover:bg-white transition-smooth"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {TERMS.map((t) => (
                <div key={t.term} className="rounded-xl border border-[#E8E1D2] bg-white p-3.5 space-y-1">
                  <p className="text-sm font-semibold text-[#B8562E]">{t.term}</p>
                  <p className="text-sm text-[#2B2620] leading-relaxed">{t.short}</p>
                  <p className="text-xs text-[#8A8172] leading-relaxed">{t.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
