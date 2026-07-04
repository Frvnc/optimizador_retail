"use client"
import { useStore } from "@/lib/store"

export function QualityBanner() {
  const { reg, data, opt } = useStore()
  if (!reg) return null

  const fewPoints = data.length < 6
  const weakFit = reg.r2 < 0.85
  const invalidOptimum = !!opt && !opt.isValid
  const noBreakEven = !!opt && opt.isValid && !opt.hasBreakEven

  if (invalidOptimum) {
    return (
      <div className="animate-fade-up rounded-lg border border-[#d9b3ac] bg-[#A6453D]/[0.07] px-4 py-3 text-sm text-[#8a382f]">
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">✕</span>
          <div className="space-y-0.5">
            <p className="font-medium">El modelo no tiene un óptimo económicamente válido</p>
            <p className="text-xs text-[#8a382f]/85">
              La pendiente de la demanda es b = {reg.b.toFixed(4)} (debe ser positiva para que Q(P) sea decreciente).
              Revisa los datos: probablemente hay un error de tipeo o los pares (Precio, Unidades) no siguen una relación inversa.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (noBreakEven && opt) {
    return (
      <div className="animate-fade-up rounded-lg border border-[#d9b3ac] bg-[#A6453D]/[0.07] px-4 py-3 text-sm text-[#8a382f]">
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠</span>
          <div className="space-y-0.5">
            <p className="font-medium">El negocio no es rentable a ningún precio</p>
            <p className="text-xs text-[#8a382f]/85">
              Incluso en el precio óptimo el beneficio es negativo (B* = {opt.bStar.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}),
              por lo que no existe punto de equilibrio real. Reduce los costos fijos/variables o revisa los datos de demanda.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!fewPoints && !weakFit) {
    // Ajuste sólido: confirmación discreta
    return (
      <div className="animate-fade-up flex items-center gap-2 rounded-lg border border-[#bcd4cb] bg-[#3E6259]/[0.06] px-4 py-2.5 text-sm text-[#2d4941]">
        <span className="text-base">✓</span>
        <span>
          Ajuste sólido — R² = <span className="font-mono font-semibold">{reg.r2.toFixed(4)}</span> con {data.length} puntos.
          El modelo lineal explica el {(reg.r2 * 100).toFixed(1)}% de la variación de la demanda.
        </span>
      </div>
    )
  }

  return (
    <div className="animate-fade-up rounded-lg border border-[#e3d3ab] bg-[#C99A3E]/[0.09] px-4 py-3 text-sm text-[#7a5a1e]">
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5">⚠</span>
        <div className="space-y-0.5">
          <p className="font-medium">Revisa la calidad del modelo</p>
          <ul className="text-xs text-[#7a5a1e]/90 list-disc pl-4 space-y-0.5">
            {weakFit && (
              <li>
                R² = <span className="font-mono">{reg.r2.toFixed(4)}</span> &lt; 0.85 — el ajuste lineal es débil.
                Revisa valores atípicos o considera otro modelo.
              </li>
            )}
            {fewPoints && (
              <li>
                Solo {data.length} punto{data.length === 1 ? "" : "s"} — se recomiendan al menos 6 para una regresión confiable.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
