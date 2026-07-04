"use client"
import { useStore } from "@/lib/store"
import { useCountUp } from "@/lib/useCountUp"
import { Sparkles, Target, TrendingUp, ArrowRight } from "lucide-react"

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

function Chip({ title, expr, color, delay }: { title: string; expr: string; color: string; delay: string }) {
  return (
    <div className={`animate-fade-up ${delay} rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur`}>
      <p className="text-[10px] uppercase tracking-wider text-[#B8AE9C] mb-0.5">{title}</p>
      <p className={`font-mono text-sm ${color}`}>{expr}</p>
    </div>
  )
}

function Arrow() {
  return <ArrowRight className="h-4 w-4 text-[#6b6255] shrink-0 hidden md:block" />
}

export function MathHero() {
  const { reg, opt, cv, productName } = useStore()
  const pStarAnim = useCountUp(opt?.pStar ?? 0)

  if (!reg || !opt || !opt.isValid) return null

  const coefB = (reg.a + cv * reg.b).toFixed(2)
  const deriv2b = (2 * reg.b).toFixed(4)

  return (
    <section className="gradient-border animate-fade-up rounded-2xl p-px shadow-xl shadow-[#2B2620]/15">
      <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-[#2B2620] via-[#332d24] to-[#3a3226] p-6">
        {/* halo decorativo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#B8562E]/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Izquierda: modelo + resultado */}
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8AE9C]">
              <Sparkles className="h-3.5 w-3.5 text-[#D98B5F]" />
              {productName} · Modelo de demanda lineal
            </p>
            <p className="text-base sm:text-lg font-medium text-[#EDE7D8] leading-snug max-w-md">
              En palabras simples: te conviene vender a <span className="text-[#D98B5F] font-semibold">{clp(pStarAnim)}</span> — con
              eso ganarías <span className="text-[#7FA894] font-semibold">{clp(opt.bStar)}</span> al mes.
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold">
              <span className="text-[#C9C2B4]">Q(P) = </span>
              <span className="text-[#8FB4D9]">{reg.a.toFixed(2)}</span>
              <span className="text-[#B8AE9C]"> − </span>
              <span className="text-[#8FB4D9]">{reg.b.toFixed(4)}</span>
              <span className="text-[#C9C2B4]">·P</span>
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Target className="h-7 w-7 text-[#D98B5F] shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-[#B8AE9C]">Precio óptimo P*</span>
                <span className="shimmer-accent font-mono text-3xl sm:text-4xl font-extrabold tabular-nums leading-none">
                  {clp(pStarAnim)}
                </span>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[#B8AE9C]">
              <TrendingUp className="h-3.5 w-3.5 text-[#7FA894]" />
              Maximiza el beneficio mensual · Q* = {Math.round(opt.qStar)} u · B* = {clp(opt.bStar)}
            </p>
          </div>

          {/* Derecha: cadena de derivación */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-col xl:min-w-[360px]">
            <div className="flex flex-wrap items-center gap-2">
              <Chip title="Ingreso" expr="I(P) = P·Q(P)" color="text-[#8FB4D9]" delay="stagger-1" />
              <Arrow />
              <Chip title="Costo" expr="C(P) = CF + cv·Q" color="text-[#C9776A]" delay="stagger-2" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip title="Beneficio" expr="B(P) = I − C" color="text-[#8FBF85]" delay="stagger-3" />
              <Arrow />
              <Chip title="Óptimo" expr={`B'(P) = −${deriv2b}P + ${coefB} = 0`} color="text-[#D98B5F]" delay="stagger-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
