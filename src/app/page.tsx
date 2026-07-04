"use client"
import { useEffect, useRef, useState } from "react"
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
import { SectionHelp } from "@/components/SectionHelp"
import {
  Download, Loader2, LineChart as LineChartIcon, Target, DollarSign,
  Package, Activity, Database, SlidersHorizontal, Sigma, BarChart3, Lock, X,
} from "lucide-react"

type Icon = typeof Target

// ── Metric card con count-up + tooltip de fórmula ──────────────────────────
function MetricCard({
  label, rawValue, format, color, barBg, iconBg, ring, plain, formula, formulaDesc, index, Icon, shimmer,
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
  shimmer?: boolean
}) {
  const animated = useCountUp(rawValue)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovering, setHovering] = useState(false)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: py * -7, ry: px * 7 })
  }
  const onMouseLeave = () => {
    setHovering(false)
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div ref={cardRef} onMouseMove={onMouseMove} onMouseEnter={() => setHovering(true)} onMouseLeave={onMouseLeave}
      style={{
        transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${hovering ? -4 : 0}px)`,
        transition: "transform 0.15s ease-out, box-shadow 0.25s ease",
      }}
      className={`group relative rounded-xl border border-[#E8E1D2] bg-white p-4 cursor-default select-none
                     overflow-hidden animate-fade-up stagger-${index + 1} shadow-warm-sm
                     ${hovering ? "shadow-warm-md" : ""} ${ring}`}>
      {/* barra de acento superior */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${barBg} opacity-80`} />

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#8A8172]">{label}</p>
        <span className={`rounded-lg p-1.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`font-mono font-bold text-xl tabular-nums ${shimmer ? "shimmer-accent" : color}`}>{format(animated)}</p>

      {/* Tooltip: explicación en palabras simples + fórmula técnica */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      w-max max-w-xs">
        <div className="bg-[#2B2620] border border-[#3a342c] rounded-xl p-3 shadow-warm-xl text-left space-y-1.5">
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
function Section({ title, subtitle, help, children }: {
  title: React.ReactNode; subtitle?: string; help?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#E8E1D2] bg-white p-6 space-y-4 shadow-warm-sm transition-smooth hover:shadow-warm-md">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2B2620]">
          {title}
          {help && <SectionHelp>{help}</SectionHelp>}
        </h3>
        {subtitle && <p className="text-xs text-[#8A8172] mt-0.5">{subtitle}</p>}
      </div>
      <div>
        <div className="divider-fade" />
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}

// Un mismo acento por pestaña, todos dentro de la familia café/terracota
// (de tueste más claro a más oscuro), para que combinen entre sí y con el fondo.
const TABS = [
  { id: "datos", number: 1, label: "Datos", simple: "Ingresa tus ventas", Icon: Database, locked: false, accent: "#B8562E" },
  { id: "graficas", number: 2, label: "Gráficas", simple: "Visualiza el modelo", Icon: BarChart3, locked: true, accent: "#A9683A" },
  { id: "sensibilidad", number: 3, label: "Sensibilidad", simple: "¿Qué pasa si cambian los costos?", Icon: SlidersHorizontal, locked: true, accent: "#7A4A2A" },
  { id: "algebra", number: 4, label: "Álgebra", simple: "Cómo se calculó", Icon: Sigma, locked: true, accent: "#4A2E1E" },
]

// ── Página principal ────────────────────────────────────────────────────────
export default function Home() {
  const { recalc, opt, reg, cf, cv, data, productName } = useStore()
  const [exporting, setExporting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeTab, setActiveTab] = useState("datos")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { recalc() }, [recalc])

  useEffect(() => {
    if (typeof window === "undefined") return
    setShowWelcome(!window.localStorage.getItem("welcome-dismissed"))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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
      ring: "hover:border-[#B8562E]/50", shimmer: true,
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

  const tabAccent = TABS.find((t) => t.id === activeTab)?.accent ?? "#B8562E"

  return (
    <div className="relative min-h-screen text-[#2B2620] flex flex-col">
      <Background accent={tabAccent} />

      {/* ── Header sticky ── */}
      <header className={`border-b border-[#E8E1D2] bg-[#F7F2E9]/85 backdrop-blur-xl sticky top-0 z-20 transition-shadow duration-300 ${scrolled ? "shadow-warm-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="logo-shine grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#B8562E] to-[#9c4726] shadow-warm-md">
              <Sigma className="relative z-10 h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block font-bold text-[#2B2620] text-sm shimmer-accent">Optimizador de Precios Dinámicos</span>
              <span className="block text-[#8A8172] text-xs truncate">{productName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
          <TabsList className="bg-white border border-[#E8E1D2] w-fit h-auto p-1.5 flex-wrap shadow-warm-sm">
            {TABS.map(({ id, number, label, simple, Icon, locked, accent }) => {
              const isLocked = locked && !unlocked
              return (
                <TabsTrigger key={id} value={id} disabled={isLocked}
                  title={isLocked ? "Calcula primero en la pestaña Datos para desbloquear" : undefined}
                  style={activeTab === id ? { backgroundColor: accent } : undefined}
                  className="flex-col items-start gap-0.5 h-auto py-2 px-3.5 text-left
                             data-[state=active]:text-white data-[state=active]:shadow-none
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
            <div className="rounded-2xl border border-[#E8E1D2] bg-white p-4 sm:p-6 shadow-warm-sm">
              <DataTable />
            </div>
          </TabsContent>

          <TabsContent value="graficas" className="animate-fade-up">
            <div className="flex flex-col gap-4">
              <Section title="Regresión lineal Q(P)"
                subtitle="Banda sombreada = intervalo de confianza 95% — qué tan bien predice el modelo"
                help={<>
                  <p><b>Qué muestra:</b> cuántas unidades (Q) se venderían para cada precio (P) posible, según tus datos.</p>
                  <p><b>Fórmula:</b> <span className="font-mono">Q(P) = a − b·P</span>, ajustada por regresión lineal a tus pares Precio-Unidades.</p>
                  <p><b>Cómo leerlo:</b> los puntos son tus ventas reales, la línea sólida es el modelo, la banda sombreada es el rango donde probablemente cae la demanda real (95% de confianza), y el marcador con anillo pulsante señala el precio óptimo P* junto a su cantidad Q*.</p>
                </>}>
                <RegressionChart />
              </Section>
              <Section title="Funciones I(P), C(P) y B(P)"
                subtitle="La línea de beneficio alcanza su máximo exactamente en P*"
                help={<>
                  <p><b>Qué muestra:</b> compara, para cada precio, cuánto entra por ventas, cuánto cuesta operar y cuánto queda de ganancia.</p>
                  <p><b>Fórmulas:</b></p>
                  <p className="font-mono">I(P) = P · Q(P)</p>
                  <p className="font-mono">C(P) = CF + cv · Q(P)</p>
                  <p className="font-mono">B(P) = I(P) − C(P)</p>
                  <p><b>Cómo leerlo:</b> el punto más alto de la línea verde (Beneficio) es la ganancia máxima, exactamente en P*. Si hay zonas sombreadas, verde = rango de precios donde ganas plata y rojo = donde pierdes (fuera de los puntos de equilibrio).</p>
                </>}>
                <FunctionsChart />
              </Section>
              <Section title="Elasticidad precio-demanda E(P)"
                subtitle="Por encima de −1 el mercado es inelástico; debajo es elástico"
                help={<>
                  <p><b>Qué muestra:</b> qué tan sensibles son los clientes a cambios de precio.</p>
                  <p><b>Fórmula:</b> <span className="font-mono">E(P) = −b·P / Q(P)</span></p>
                  <p><b>Cómo leerlo:</b> la línea punteada horizontal en E = −1 marca la frontera. Por encima de −1 (más cerca de 0) la demanda es inelástica: subir el precio casi no afecta las ventas. Por debajo de −1 es elástica: subir el precio hace caer fuerte las ventas y reduce los ingresos totales.</p>
                </>}>
                <ElasticityChart />
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="sensibilidad" className="animate-fade-up">
            <Section title="Análisis de sensibilidad"
              subtitle="Ajusta costos fijos y variables — los resultados se actualizan al instante"
              help={<>
                <p><b>Qué muestra:</b> cómo cambian el precio óptimo P*, el beneficio B* y las unidades Q* si cambian tus costos.</p>
                <p><b>Costo Fijo (CF):</b> gastos mensuales que no dependen de cuánto vendas (arriendo, sueldos fijos).</p>
                <p><b>Costo Variable (cv):</b> lo que cuesta cada unidad vendida (insumos, embalaje).</p>
                <p><b>Derivadas:</b> <span className="font-mono">∂P*/∂CF = 0</span> (CF no mueve el precio óptimo, solo la ganancia) y <span className="font-mono">∂P*/∂cv = 1/(2b)</span> (cada peso extra de costo variable sube P* en esa cantidad).</p>
              </>}>
              <SensitivityPanel />
            </Section>
          </TabsContent>

          <TabsContent value="algebra" className="animate-fade-up">
            <Section title="Desarrollo algebraico paso a paso"
              subtitle="Derivación formal de B′(P*) = 0 con los valores reales del modelo"
              help={<>
                <p><b>Qué muestra:</b> la derivación matemática completa, paso a paso, con los números reales de tu modelo.</p>
                <p><b>El camino:</b> parte de la demanda Q(P), arma el ingreso I(P) y el costo C(P), resta para obtener el beneficio B(P), deriva e iguala a cero (B′(P*) = 0) para encontrar el precio óptimo, y confirma con la segunda derivada (B″(P) &lt; 0) que es un máximo y no un mínimo.</p>
                <p>Al final se calculan los puntos de equilibrio (B = 0), donde el negocio ni gana ni pierde.</p>
              </>}>
              <ResultsPanel />
            </Section>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E8E1D2] bg-white/60 backdrop-blur mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-center gap-2 text-xs text-[#8A8172]">
          <LineChartIcon className="h-4 w-4 text-[#B8562E]" />
          <span>Optimizador de Precios Dinámicos</span>
        </div>
      </footer>

      {/* ── Contenedor oculto: gráficas para capturar en el PDF ── */}
      <div id="pdf-charts" aria-hidden className="fixed -left-[9999px] top-0 w-[760px] bg-white p-4 space-y-4">
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Regresión lineal Q(P)</p>
          <RegressionChart plain />
        </div>
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Funciones I(P), C(P) y B(P)</p>
          <FunctionsChart plain />
        </div>
        <div data-pdf-chart className="bg-white p-3 rounded-xl">
          <p className="text-sm text-[#2B2620] mb-2">Elasticidad E(P)</p>
          <ElasticityChart plain />
        </div>
      </div>
    </div>
  )
}
