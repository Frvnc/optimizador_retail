"use client"
import {
  ResponsiveContainer, ComposedChart, LineChart, Line,
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ReferenceArea
} from "recharts"
import { useStore } from "@/lib/store"
import { buildCurves, buildRegressionBand } from "@/lib/math"
import { InfoTerm } from "@/components/InfoTerm"

const fmtP = (v: number) => `$${(v / 1000).toFixed(1)}k`
const fmtM = (v: number) => {
  const abs = Math.abs(v)
  return abs >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`
}

const tooltipStyle = { background: "#ffffff", border: "1px solid #E8E1D2", borderRadius: 10, fontSize: 12, color: "#2B2620" }
const axisTick = { fill: "#8A8172", fontSize: 11 }
const axisLabel = { fill: "#8A8172", fontSize: 11 }

// Los 3 gráficos comparten este id para sincronizar el cursor entre ellos al pasar el mouse
const SYNC_ID = "precio-charts"

// ── Marcador reutilizable del precio óptimo P* (con anillo pulsante) ───────
function PStarMarker(props: { cx?: number; cy?: number; label?: string; color?: string }) {
  const { cx, cy, label, color = "#B8562E" } = props
  if (cx == null || cy == null) return <g />
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.45} className="pulse-ring" />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
      {label && (
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
          {label}
        </text>
      )}
    </g>
  )
}

export function RegressionChart({ plain }: { plain?: boolean } = {}) {
  const { data, reg, regQuad, opt } = useStore()
  if (!reg || data.length < 3) return null

  const band = buildRegressionBand(data, reg)

  // Inject actual data points into band dataset
  const dataMap = new Map(data.map(d => [d.p, d.q]))
  const combined = band.map(pt => ({
    ...pt,
    q_real: dataMap.get(pt.p) ?? null,
    q_quad: regQuad ? regQuad.a - regQuad.b * pt.p + regQuad.c * pt.p * pt.p : null,
  }))

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { q_real: number | null } }) => {
    const { cx, cy, payload } = props
    if (!payload?.q_real || !cx || !cy) return <g />
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#B8562E" fillOpacity={0.18} />
        <circle cx={cx} cy={cy} r={5} fill="#B8562E" stroke="#fff" strokeWidth={1.5} />
      </g>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A8172]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#B8562E]" />
          Datos reales ({data.length} puntos)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#5B7FA6]" />
          <InfoTerm plain={plain} text="El modelo ajustado a tus datos: predice cuántas unidades (Q) se venden para cada precio (P).">Q(P)</InfoTerm> = {reg.a.toFixed(2)} − {reg.b.toFixed(4)}·P
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded bg-[#5B7FA6] opacity-20" />
          <InfoTerm plain={plain} text="El rango donde muy probablemente caería la demanda real. Mientras más angosta, más segura es la predicción del modelo.">Intervalo confianza 95%</InfoTerm>
        </span>
        {regQuad && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-[#8570A6]" style={{ borderTop: "2px dashed #8570A6", background: "none" }} />
            <InfoTerm plain={plain} text="Un modelo alternativo (curva en vez de línea recta) que se muestra solo como comparación — no reemplaza al modelo lineal usado para calcular P*.">Q(P) cuadrática</InfoTerm> (R² = {regQuad.r2.toFixed(4)})
          </span>
        )}
        <span className="ml-auto font-mono text-[#3E6259] font-medium">
          <InfoTerm plain={plain} text="Qué tan bien la línea del modelo lineal predice tus ventas reales. Va de 0 a 1: más cerca de 1 es mejor.">R² lineal</InfoTerm> = {reg.r2.toFixed(4)}
        </span>
      </div>
      {regQuad && (
        <p className="text-xs text-[#a89f8f]">
          {regQuad.r2 - reg.r2 > 0.02
            ? "El modelo cuadrático mejora notoriamente el ajuste — considera evaluarlo como alternativa."
            : "La mejora del modelo cuadrático es marginal: se prefiere el lineal por ser más simple (menos parámetros) con un ajuste prácticamente igual."}
        </p>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={combined} margin={{ top: 10, right: 24, bottom: 24, left: 16 }}
          syncId={SYNC_ID} syncMethod="value">
          <defs>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#5B7FA6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#5B7FA6" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D2" />
          <XAxis
            dataKey="p" type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtP} stroke="#D8CFBC"
            tick={axisTick}
            label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, ...axisLabel }}
          />
          <YAxis
            stroke="#D8CFBC" tick={axisTick}
            label={{ value: "Unidades Q", angle: -90, position: "insideLeft", offset: 14, ...axisLabel }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === "q_real") return [`${v} uds`, "Dato real"]
              if (name === "q_reg")  return [`${v.toFixed(1)} uds`, "Modelo lineal"]
              if (name === "q_quad") return [`${v.toFixed(1)} uds`, "Modelo cuadrático"]
              return [null, null]
            }}
          />
          {/* Banda de confianza: upper rellena, lower enmascara con fondo */}
          <Area type="monotone" dataKey="q_upper" stroke="none" fill="url(#bandGrad)" legendType="none" tooltipType="none" isAnimationActive={!plain} />
          <Area type="monotone" dataKey="q_lower" stroke="none" fill="#ffffff" legendType="none" tooltipType="none" isAnimationActive={!plain} />
          {/* Línea de regresión lineal */}
          <Line type="monotone" dataKey="q_reg"  stroke="#5B7FA6" strokeWidth={2.5} dot={false} name="q_reg"
            isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
          {/* Línea de regresión cuadrática (comparación) */}
          {regQuad && (
            <Line type="monotone" dataKey="q_quad" stroke="#8570A6" strokeWidth={1.75} strokeDasharray="6 4"
              dot={false} name="q_quad" isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
          )}
          {/* Puntos reales */}
          <Line type="monotone" dataKey="q_real" stroke="none" dot={<CustomDot />}
            activeDot={{ r: 8, fill: "#B8562E" }} name="q_real" connectNulls={false}
            isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
          {/* Marcador del precio óptimo P* con su cantidad Q* */}
          {opt && opt.isValid && (
            <ReferenceDot x={opt.pStar} y={opt.qStar} r={5}
              shape={<PStarMarker label="P*, Q*" />} ifOverflow="extendDomain" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunctionsChart({ plain }: { plain?: boolean } = {}) {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt || !opt.isValid) return null

  const pMin = opt.hasBreakEven ? Math.max(100, opt.breakEven1 * 0.6) : opt.pStar * 0.4
  const pMax = opt.hasBreakEven ? opt.breakEven2 * 1.22 : opt.pStar * 1.8
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A8172]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#5B7FA6]" />
          <InfoTerm plain={plain} text="Ingreso total: todo el dinero que entra por ventas a cada precio (precio × unidades vendidas).">I(P) Ingresos</InfoTerm>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#A6453D]" />
          <InfoTerm plain={plain} text="Costo total: lo que cuesta operar a cada precio (costo fijo + costo variable por unidad vendida).">C(P) Costos</InfoTerm>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#3E6259]" />
          <InfoTerm plain={plain} text="Beneficio: la ganancia real, Ingresos menos Costos. Su punto más alto marca el precio óptimo P*.">B(P) Beneficio</InfoTerm>
        </span>
      </div>
      <p className="text-xs text-[#8A8172]">
        {opt.hasBreakEven
          ? <>Zona verde = rango de precios donde ganas plata · zona roja = donde pierdes. El punto marca la ganancia máxima en <span className="text-[#B8562E] font-medium">P*</span>.</>
          : <>La línea verde (Beneficio) sube y luego baja — su punto más alto marca el precio óptimo{" "}
              <span className="text-[#B8562E] font-medium">P*</span>.</>}
      </p>
      <ResponsiveContainer width="100%" height={320}>
      <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 20 }}
        syncId={SYNC_ID} syncMethod="value">
        <defs>
          <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3E6259" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#3E6259" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D2" />
        {opt.hasBreakEven && (
          <>
            <ReferenceArea x1={pMin} x2={opt.breakEven1} fill="#A6453D" fillOpacity={0.05} ifOverflow="extendDomain" />
            <ReferenceArea x1={opt.breakEven1} x2={opt.breakEven2} fill="#3E6259" fillOpacity={0.06} ifOverflow="extendDomain" />
            <ReferenceArea x1={opt.breakEven2} x2={pMax} fill="#A6453D" fillOpacity={0.05} ifOverflow="extendDomain" />
          </>
        )}
        <XAxis dataKey="p" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmtP} stroke="#D8CFBC"
          tick={axisTick}
          label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, ...axisLabel }} />
        <YAxis tickFormatter={fmtM} stroke="#D8CFBC" tick={axisTick} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
          formatter={(value, n) => [`$${Math.round(Number(value)).toLocaleString("es-CL")}`, n]}
        />
        <ReferenceLine y={0} stroke="#D8CFBC" strokeWidth={1} />
        <ReferenceLine x={opt.pStar} stroke="#B8562E" strokeDasharray="5 3" strokeWidth={1.5} />
        {opt.hasBreakEven && (
          <>
            <ReferenceLine x={opt.breakEven1} stroke="#C99A3E" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine x={opt.breakEven2} stroke="#C99A3E" strokeDasharray="3 3" strokeWidth={1} />
          </>
        )}
        <Line type="monotone" dataKey="ip" name="I(P) Ingresos"  stroke="#5B7FA6" strokeWidth={2}   dot={false}
          isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
        <Line type="monotone" dataKey="cp" name="C(P) Costos"    stroke="#A6453D" strokeWidth={2}   dot={false}
          isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
        <Line type="monotone" dataKey="bp" name="B(P) Beneficio" stroke="#3E6259" strokeWidth={2.5} dot={false}
          isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
        <ReferenceDot x={opt.pStar} y={opt.bStar} r={5} shape={<PStarMarker label="Ganancia máxima" />}
          ifOverflow="extendDomain" />
      </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ElasticityChart({ plain }: { plain?: boolean } = {}) {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt || !opt.isValid) return null

  const pMin = opt.hasBreakEven ? Math.max(1, opt.breakEven1 * 0.8) : opt.pStar * 0.5
  const pMax = opt.hasBreakEven ? opt.breakEven2 * 1.05 : opt.pStar * 1.5
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A8172]">
        <span>
          <InfoTerm plain={plain} text="Elasticidad en el precio óptimo: mide qué tan sensibles son los clientes al precio, justo en P*.">E(P*)</InfoTerm> = <span className="font-mono font-bold text-[#3E6259]">{opt.eStar.toFixed(3)}</span>
        </span>
        <span className="text-[#D8CFBC]">·</span>
        <span className={Math.abs(opt.eStar) > 1 ? "text-[#3E6259]" : "text-[#C99A3E]"}>
          {Math.abs(opt.eStar) > 1
            ? "Demanda elástica — subir el precio reduce los ingresos"
            : "Demanda inelástica — el precio no mueve mucho la cantidad"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 10 }}
          syncId={SYNC_ID} syncMethod="value">
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D2" />
          <XAxis dataKey="p" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmtP} stroke="#D8CFBC" tick={axisTick}
            label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, ...axisLabel }} />
          <YAxis domain={[-8, 0]} allowDataOverflow stroke="#D8CFBC" tick={axisTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
            formatter={(value) => [Number(value).toFixed(3), "E(P)"]}
          />
          <ReferenceLine y={-1} stroke="#C99A3E" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "E = −1  frontera elástica", fill: "#C99A3E", fontSize: 10, position: "insideBottomRight" }} />
          <ReferenceLine x={opt.pStar} stroke="#B8562E" strokeDasharray="5 3" strokeWidth={1.5} />
          <Line type="monotone" dataKey="ep" name="E(P)" stroke="#8570A6" strokeWidth={2.5} dot={false}
            isAnimationActive={!plain} animationDuration={900} animationEasing="ease-out" />
          <ReferenceDot x={opt.pStar} y={Math.max(-8, Math.min(0, opt.eStar))} r={5}
            shape={<PStarMarker label="E(P*)" color="#8570A6" />} ifOverflow="extendDomain" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
