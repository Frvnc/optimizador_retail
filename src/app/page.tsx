"use client"
import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { useCountUp } from "@/lib/useCountUp"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { ResultsPanel } from "@/components/ResultsPanel"
import { RegressionChart, FunctionsChart, ElasticityChart } from "@/components/Charts"
import { SensitivityPanel } from "@/components/SensitivityPanel"

// ── Metric card con count-up + tooltip de fórmula ──────────────────────────
function MetricCard({
  label, rawValue, format, color, border, bg, formula, formulaDesc,
}: {
  label: string
  rawValue: number
  format: (n: number) => string
  color: string
  border: string
  bg: string
  formula: string
  formulaDesc: string
}) {
  const animated = useCountUp(rawValue)
  return (
    <div className={`group relative rounded-xl border ${border} ${bg} p-4 cursor-default select-none`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-mono font-bold text-xl ${color} tabular-nums`}>{format(animated)}</p>

      {/* Tooltip con fórmula */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      w-max max-w-xs">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-left">
          <p className={`font-mono text-sm font-bold ${color} mb-1`}>{formula}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{formulaDesc}</p>
        </div>
        <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45
                        mx-auto -mt-1.5" />
      </div>
    </div>
  )
}

// ── Sección genérica ────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1b2a] p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="border-t border-slate-800/60 pt-4">{children}</div>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function Home() {
  const { recalc, opt, reg, cf, cv } = useStore()

  useEffect(() => { recalc() }, [recalc])

  const clp = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

  const metrics = opt && reg ? [
    {
      label: "Precio óptimo P*",
      rawValue: opt.pStar,
      format: clp,
      color: "text-orange-400",
      border: "border-orange-500/20",
      bg: "bg-orange-500/5",
      formula: "P* = (a + cv·b) / (2b)",
      formulaDesc: `Con a=${reg.a.toFixed(1)}, b=${reg.b.toFixed(4)}, cv=${cv.toLocaleString("es-CL")} → P* = ${Math.round(opt.pStar).toLocaleString("es-CL")} CLP`,
    },
    {
      label: "Unidades Q*",
      rawValue: opt.qStar,
      format: (n: number) => `${Math.round(n)} u`,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      formula: "Q* = a − b·P*",
      formulaDesc: `${reg.a.toFixed(1)} − ${reg.b.toFixed(4)}·${Math.round(opt.pStar).toLocaleString("es-CL")} = ${Math.round(opt.qStar)} unidades/mes`,
    },
    {
      label: "Beneficio B*",
      rawValue: opt.bStar,
      format: clp,
      color: "text-teal-400",
      border: "border-teal-500/20",
      bg: "bg-teal-500/5",
      formula: "B* = I(P*) − C(P*)",
      formulaDesc: `CF = ${clp(cf)}, cv = ${clp(cv)}/u → B* = ${clp(opt.bStar)}/mes`,
    },
    {
      label: "Elasticidad E(P*)",
      rawValue: opt.eStar,
      format: (n: number) => n.toFixed(3),
      color: Math.abs(opt.eStar) > 1 ? "text-green-400" : "text-yellow-400",
      border: Math.abs(opt.eStar) > 1 ? "border-green-500/20" : "border-yellow-500/20",
      bg: Math.abs(opt.eStar) > 1 ? "bg-green-500/5" : "bg-yellow-500/5",
      formula: "E(P*) = −b·P* / Q*",
      formulaDesc: Math.abs(opt.eStar) > 1
        ? `|E| = ${Math.abs(opt.eStar).toFixed(3)} > 1 → demanda elástica: bajar precio aumenta ingresos totales`
        : `|E| = ${Math.abs(opt.eStar).toFixed(3)} < 1 → demanda inelástica`,
    },
  ] : null

  return (
    <div className="min-h-screen bg-[#070f1a] text-slate-100 flex flex-col">

      {/* ── Header sticky ── */}
      <header className="border-b border-slate-800/80 bg-[#0d1b2a]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-orange-400" />
            <div>
              <span className="font-semibold text-white text-sm">Optimizador de Precios Dinámicos</span>
              <span className="text-slate-500 text-xs ml-3">Cálculo Diferencial · INACAP 2026</span>
            </div>
          </div>
          <span className="text-xs text-slate-600 hidden sm:block">ABPro · Etapa III</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* ── Métricas (con count-up + tooltip) ── */}
        {metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map(m => <MetricCard key={m.label} {...m} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-slate-600 text-sm">
            Ingresa datos en la pestaña{" "}
            <span className="text-orange-400 font-medium">Datos</span>{" "}
            y presiona <span className="text-orange-400 font-medium">Calcular</span>
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="datos" className="flex flex-col gap-4">
          <TabsList className="bg-slate-900 border border-slate-800 w-fit">
            {["datos", "graficas", "sensibilidad", "algebra"].map(tab => (
              <TabsTrigger key={tab} value={tab}
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-slate-400 text-sm px-5 capitalize">
                {tab === "graficas" ? "Gráficas" : tab === "algebra" ? "Álgebra" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="datos">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1b2a] p-6">
              <DataTable />
            </div>
          </TabsContent>

          <TabsContent value="graficas">
            <div className="flex flex-col gap-4">
              <Section title="Regresión lineal Q(P)"
                subtitle="Banda sombreada = intervalo de confianza 95% — qué tan bien predice el modelo">
                <RegressionChart />
              </Section>
              <Section title="Funciones I(P), C(P) y B(P)"
                subtitle="La línea verde alcanza su máximo exactamente en P* (línea naranja)">
                <FunctionsChart />
              </Section>
              <Section title="Elasticidad precio-demanda E(P)"
                subtitle="Por encima de −1 el mercado es inelástico; debajo es elástico">
                <ElasticityChart />
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="sensibilidad">
            <Section title="Análisis de sensibilidad"
              subtitle="Ajusta costos fijos y variables — los resultados se actualizan al instante">
              <SensitivityPanel />
            </Section>
          </TabsContent>

          <TabsContent value="algebra">
            <Section title="Desarrollo algebraico paso a paso"
              subtitle="Derivación formal de B′(P*) = 0 con los valores reales del modelo">
              <ResultsPanel />
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
