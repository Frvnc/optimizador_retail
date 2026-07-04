"use client"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { useCountUp } from "@/lib/useCountUp"
import { exportReport } from "@/lib/pdf"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { ResultsPanel } from "@/components/ResultsPanel"
import { RegressionChart, FunctionsChart, ElasticityChart } from "@/components/Charts"
import { SensitivityPanel } from "@/components/SensitivityPanel"
import { MathHero } from "@/components/MathHero"
import { QualityBanner } from "@/components/QualityBanner"
import { Background } from "@/components/Background"
import { GlossaryPanel } from "@/components/GlossaryPanel"
import {
  Download, Loader2, LineChart as LineChartIcon, Target, DollarSign,
  Package, Activity, Database, SlidersHorizontal, Sigma, BarChart3, Lock, X,
} from "lucide-react"

type Icon = typeof Target

// ── Metric card con count-up + tooltip de fórmula ──────────────────────────
function MetricCard({
  label, rawValue, format, color, barBg, iconBg, ring, plain, formula, formulaDesc, index, Icon,
}: {
  label: string
  rawValue: number
  format: (n: number) => string
  color: string
  barBg: string
  iconBg: string
  ring: string
  plain: string
  formula: string
  formulaDesc: string
  index: number
  Icon: Icon
}) {
  const animated = useCountUp(rawValue)
  return (
    <div className={`group relative rounded-xl border border-[#E8E1D2] bg-white p-4 cursor-default select-none
                     overflow-hidden animate-fade-up stagger-${index + 1} shadow-sm
                     transition-smooth hover:-translate-y-1 hover:shadow-md ${ring}`}>
      {/* barra de acento superior */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${barBg} opacity-80`} />

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#8A8172]">{label}</p>
        <span className={`rounded-lg p-1.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`font-mono font-bold text-xl ${color} tabular-nums`}>{format(animated)}</p>

      {/* Tooltip: explicación en palabras simples + fórmula técnica */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      w-max max-w-xs">
        <div className="bg-[#2B2620] border border-[#3a342c] rounded-xl p-3 shadow-xl text-left space-y-1.5">
          <p className="text-xs text-white leading-relaxed">{plain}</p>
          <div className="border-t border-[#3a342c] pt-1.5">
            <p className={`font-mono text-sm font-bold ${color} mb-1`}>{formula}</p>
            <p className="text-xs text-[#C9C2B4] leading-relaxed">{formulaDesc}</p>
          </div>
        </div>
        <div className="w-2.5 h-2.5 bg-[#2B2620] border-r border-b border-[#3a342c] rotate-45
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
    <div className="rounded-2xl border border-[#E8E1D2] bg-white p-6 space-y-4 shadow-sm transition-smooth hover:shadow-md">
      <div>
        <h3 className="text-sm font-semibold text-[#2B2620]">{title}</h3>
        {subtitle && <p className="text-xs text-[#8A8172] mt-0.5">{subtitle}</p>}
      </div>
      <div className="border-t border-[#E8E1D2] pt-4">{children}</div>
    </div>
  )
}

const INTEGRANTES = ["Francisco Parra", "Joaquín Álamos", "Guido Zapata", "Luis Cortes", "Alejandro Jara"]

const TABS = [
  { id: "datos", number: 1, label: "Datos", simple: "Ingresa tus ventas", Icon: Database, locked: false },
  { id: "graficas", number: 2, label: "Gráficas", simple: "Visualiza el modelo", Icon: BarChart3, locked: true },
  { id: "sensibilidad", number: 3, label: "Sensibilidad", simple: "¿Qué pasa si cambian los costos?", Icon: SlidersHorizontal, locked: true },
  { id: "algebra", number: 4, label: "Álgebra", simple: "Cómo se calculó", Icon: Sigma, locked: true },
]

// ── Página principal ────────────────────────────────────────────────────────
export default function Home() {
  const { recalc, opt, reg, cf, cv, data, productName } = useStore()
  const [exporting, setExporting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => { recalc() }, [recalc])

  useEffect(() => {
    if (typeof window === "undefined") return
    setShowWelcome(!window.localStorage.getItem("welcome-dismissed"))
  }, [])

  const dismissWelcome = () => {
    setShowWelcome(false)
    window.localStorage.setItem("welcome-dismissed", "1")
  }

  const unlocked = !!opt && opt.isValid

  const clp = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

  const handleExport = async () => {
    if (!reg || !opt || !opt.isValid) return
    setExporting(true)
    try {
      await exportReport({ productName, reg, opt, cf, cv, data })
    } catch (err) {
      console.error("Error al exportar PDF:", err)
      alert("No se pudo generar el PDF. Revisa la consola para más detalles.")
    } finally {
      setExporting(false)
    }
  }

  const metrics = opt && reg && opt.isValid ? [
    {
      label: "Precio óptimo P*", rawValue: opt.pStar, format: clp, Icon: Target,
      color: "text-[#B8562E]", barBg: "bg-[#B8562E]", iconBg: "bg-[#B8562E]/10",
      ring: "hover:border-[#B8562E]/50",
      plain: "El precio al que te conviene vender para ganar la mayor plata posible al mes.",
      formula: "P* = (a + cv·b) / (2b)",
      formulaDesc: `Con a=${reg.a.toFixed(1)}, b=${reg.b.toFixed(4)}, cv=${cv.toLocaleString("es-CL")} → P* = ${Math.round(opt.pStar).toLocaleString("es-CL")} CLP`,
    },
    {
      label: "Unidades Q*", rawValue: opt.qStar, format: (n: number) => `${Math.round(n)} u`, Icon: Package,
      color: "text-[#5B7FA6]", barBg: "bg-[#5B7FA6]", iconBg: "bg-[#5B7FA6]/10",
      ring: "hover:border-[#5B7FA6]/50",
      plain: "Cuántas unidades se venderían al mes si cobras justo el precio óptimo P*.",
      formula: "Q* = a − b·P*",
      formulaDesc: `${reg.a.toFixed(1)} − ${reg.b.toFixed(4)}·${Math.round(opt.pStar).toLocaleString("es-CL")} = ${Math.round(opt.qStar)} unidades/mes`,
    },
    {
      label: "Beneficio B*", rawValue: opt.bStar, format: clp, Icon: DollarSign,
      color: "text-[#3E6259]", barBg: "bg-[#3E6259]", iconBg: "bg-[#3E6259]/10",
      ring: "hover:border-[#3E6259]/50",
      plain: "La ganancia mensual real: lo que entra por ventas menos todos los costos.",
      formula: "B* = I(P*) − C(P*)",
      formulaDesc: `CF = ${clp(cf)}, cv = ${clp(cv)}/u → B* = ${clp(opt.bStar)}/mes`,
    },
    {
      label: "Elasticidad E(P*)", rawValue: opt.eStar, format: (n: number) => n.toFixed(3), Icon: Activity,
      color: Math.abs(opt.eStar) > 1 ? "text-[#5C8A57]" : "text-[#C99A3E]",
      barBg: Math.abs(opt.eStar) > 1 ? "bg-[#5C8A57]" : "bg-[#C99A3E]",
      iconBg: Math.abs(opt.eStar) > 1 ? "bg-[#5C8A57]/10" : "bg-[#C99A3E]/10",
      ring: Math.abs(opt.eStar) > 1 ? "hover:border-[#5C8A57]/50" : "hover:border-[#C99A3E]/50",
      plain: "Mide qué tan sensibles son tus clientes al precio. Un número grande (en valor absoluto) significa que compran mucho menos si subes el precio.",
      formula: "E(P*) = −b·P* / Q*",
      formulaDesc: Math.abs(opt.eStar) > 1
        ? `|E| = ${Math.abs(opt.eStar).toFixed(3)} > 1 → demanda elástica: bajar precio aumenta ingresos totales`
        : `|E| = ${Math.abs(opt.eStar).toFixed(3)} < 1 → demanda inelástica`,
    },
  ] : null

  return (
    <div className="relative min-h-screen text-[#2B2620] flex flex-col">
      <Background />

      {/* ── Header sticky ── */}
      <header className="border-b border-[#E8E1D2] bg-[#F7F2E9]/85 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#B8562E] to-[#9c4726] shadow-md shadow-[#B8562E]/20">
              <Sigma className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block font-bold text-[#2B2620] text-sm text-gradient">Optimizador de Precios Dinámicos</span>
              <span className="block text-[#8A8172] text-xs truncate">{productName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-[#8A8172] hidden md:block">Cálculo Diferencial · INACAP 2026</span>
            <GlossaryPanel />
            <button
              onClick={handleExport}
              disabled={!reg || !opt || !opt.isValid || exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#B8562E] to-[#9c4726]
                         hover:from-[#c2643c] hover:to-[#a85030] shadow-md shadow-[#B8562E]/20
                         disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium
                         px-3.5 py-2 transition-smooth"
            >
              {exporting ? (
                <><Loader2 className="h-3.5 w-3.5 spin-slow" /> Generando…</>
              ) : (
                <><Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Exportar PDF</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6 flex-1">

        {/* ── Banner de bienvenida ── */}
        {showWelcome && (
          <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-[#B8562E]/25 bg-[#B8562E]/[0.06] px-4 py-3">
            <p className="flex-1 text-sm text-[#5c4634]">
              Esta app encuentra el precio al que más te conviene vender: el que te da la mayor ganancia posible,
              a partir de tus datos de ventas. Ya está cargada con un ejemplo (Café 250g) — recorre los pasos
              numerados abajo o reemplaza los datos por los tuyos en la pestaña <b>1. Datos</b>.
            </p>
            <button onClick={dismissWelcome} className="text-[#8A8172] hover:text-[#A6453D] transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Hero matemático ── */}
        <MathHero />

        {/* ── Banner de calidad del ajuste ── */}
        <QualityBanner />

        {/* ── Métricas (con count-up + tooltip) ── */}
        {metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
          </div>
        ) : opt && reg && !opt.isValid ? (
          <div className="rounded-xl border border-dashed border-[#c98d7f] bg-[#A6453D]/5 p-5 text-center text-[#8a382f] text-sm">
            El modelo no arrojó un óptimo válido: la regresión da una demanda no decreciente en precio
            (b ≤ 0) o resultados negativos. Revisa los datos en{" "}
            <span className="text-[#B8562E] font-medium">Datos</span>.
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#E8E1D2] p-5 text-center text-[#8A8172] text-sm">
            Ingresa datos en la pestaña{" "}
            <span className="text-[#B8562E] font-medium">Datos</span>{" "}
            y presiona <span className="text-[#B8562E] font-medium">Calcular</span>
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="datos" className="flex flex-col gap-4">
          <TabsList className="bg-white border border-[#E8E1D2] w-fit h-auto p-1.5 flex-wrap shadow-sm">
            {TABS.map(({ id, number, label, simple, Icon, locked }) => {
              const isLocked = locked && !unlocked
              return (
                <TabsTrigger key={id} value={id} disabled={isLocked}
                  title={isLocked ? "Calcula primero en la pestaña Datos para desbloquear" : undefined}
                  className="flex-col items-start gap-0.5 h-auto py-2 px-3.5 text-left
                             data-[state=active]:bg-[#B8562E] data-[state=active]:text-white data-[state=active]:shadow-none
                             text-[#8A8172]">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="grid place-items-center h-4 w-4 rounded-full bg-current/15 text-[10px] font-bold shrink-0">
                      {number}
                    </span>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {isLocked && <Lock className="h-3 w-3 opacity-60" />}
                  </span>
                  <span className="text-[10px] font-normal opacity-70 pl-[22px]">{simple}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="datos" className="animate-fade-up">
            <div className="rounded-2xl border border-[#E8E1D2] bg-white p-4 sm:p-6 shadow-sm">
              <DataTable />
            </div>
          </TabsContent>

          <TabsContent value="graficas" className="animate-fade-up">
            <div className="flex flex-col gap-4">
              <Section title="Regresión lineal Q(P)"
                subtitle="Banda sombreada = intervalo de confianza 95% — qué tan bien predice el modelo">
                <RegressionChart />
              </Section>
              <Section title="Funciones I(P), C(P) y B(P)"
                subtitle="La línea de beneficio alcanza su máximo exactamente en P*">
                <FunctionsChart />
              </Section>
              <Section title="Elasticidad precio-demanda E(P)"
                subtitle="Por encima de −1 el mercado es inelástico; debajo es elástico">
                <ElasticityChart />
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="sensibilidad" className="animate-fade-up">
            <Section title="Análisis de sensibilidad"
              subtitle="Ajusta costos fijos y variables — los resultados se actualizan al instante">
              <SensitivityPanel />
            </Section>
          </TabsContent>

          <TabsContent value="algebra" className="animate-fade-up">
            <Section title="Desarrollo algebraico paso a paso"
              subtitle="Derivación formal de B′(P*) = 0 con los valores reales del modelo">
              <ResultsPanel />
            </Section>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E8E1D2] bg-white/60 backdrop-blur mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8A8172]">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-[#B8562E]" />
            <span>Cálculo Diferencial · ABPro · INACAP 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {INTEGRANTES.map((n, i) => (
              <span key={n} className="flex items-center gap-3">
                {i > 0 && <span className="text-[#D8CFBC]">·</span>}
                <span className="text-[#6b6255]">{n}</span>
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Contenedor oculto: gráficas para capturar en el PDF ── */}
      <div id="pdf-charts" aria-hidden className="fixed -left-[9999px] top-0 w-[760px] bg-white p-4 space-y-4">
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Regresión lineal Q(P)</p>
          <RegressionChart />
        </div>
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Funciones I(P), C(P) y B(P)</p>
          <FunctionsChart />
        </div>
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Elasticidad E(P)</p>
          <ElasticityChart />
        </div>
      </div>
    </div>
  )
}
