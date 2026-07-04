"use client"
import {
  ResponsiveContainer, ComposedChart, LineChart, Line,
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend
} from "recharts"
import { useStore } from "@/lib/store"
import { buildCurves, buildRegressionBand } from "@/lib/math"

const fmtP = (v: number) => `$${(v / 1000).toFixed(1)}k`
const fmtM = (v: number) => {
  const abs = Math.abs(v)
  return abs >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`
}

const tooltipStyle = { background: "#ffffff", border: "1px solid #E8E1D2", borderRadius: 10, fontSize: 12, color: "#2B2620" }
const axisTick = { fill: "#8A8172", fontSize: 11 }
const axisLabel = { fill: "#8A8172", fontSize: 11 }

export function RegressionChart() {
  const { data, reg, regQuad } = useStore()
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
          Q(P) = {reg.a.toFixed(2)} − {reg.b.toFixed(4)}·P
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded bg-[#5B7FA6] opacity-20" />
          Intervalo confianza 95%
        </span>
        {regQuad && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-[#8570A6]" style={{ borderTop: "2px dashed #8570A6", background: "none" }} />
            Q(P) cuadrática (R² = {regQuad.r2.toFixed(4)})
          </span>
        )}
        <span className="ml-auto font-mono text-[#3E6259] font-medium">R² lineal = {reg.r2.toFixed(4)}</span>
      </div>
      {regQuad && (
        <p className="text-xs text-[#a89f8f]">
          {regQuad.r2 - reg.r2 > 0.02
            ? "El modelo cuadrático mejora notoriamente el ajuste — considera evaluarlo como alternativa."
            : "La mejora del modelo cuadrático es marginal: se prefiere el lineal por ser más simple (menos parámetros) con un ajuste prácticamente igual."}
        </p>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={combined} margin={{ top: 10, right: 24, bottom: 24, left: 16 }}>
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
          <Area type="monotone" dataKey="q_upper" stroke="none" fill="url(#bandGrad)" legendType="none" tooltipType="none" />
          <Area type="monotone" dataKey="q_lower" stroke="none" fill="#ffffff" legendType="none" tooltipType="none" />
          {/* Línea de regresión lineal */}
          <Line type="monotone" dataKey="q_reg"  stroke="#5B7FA6" strokeWidth={2.5} dot={false} name="q_reg" />
          {/* Línea de regresión cuadrática (comparación) */}
          {regQuad && (
            <Line type="monotone" dataKey="q_quad" stroke="#8570A6" strokeWidth={1.75} strokeDasharray="6 4"
              dot={false} name="q_quad" />
          )}
          {/* Puntos reales */}
          <Line type="monotone" dataKey="q_real" stroke="none" dot={<CustomDot />}
            activeDot={{ r: 8, fill: "#B8562E" }} name="q_real" connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunctionsChart() {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt || !opt.isValid) return null

  const pMin = opt.hasBreakEven ? Math.max(100, opt.breakEven1 * 0.6) : opt.pStar * 0.4
  const pMax = opt.hasBreakEven ? opt.breakEven2 * 1.22 : opt.pStar * 1.8
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#8A8172]">
        La línea verde (Beneficio) sube y luego baja — su punto más alto marca el precio óptimo{" "}
        <span className="text-[#B8562E] font-medium">P*</span>.
      </p>
      <ResponsiveContainer width="100%" height={320}>
      <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 20 }}>
        <defs>
          <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3E6259" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#3E6259" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D2" />
        <XAxis dataKey="p" tickFormatter={fmtP} stroke="#D8CFBC"
          tick={axisTick}
          label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, ...axisLabel }} />
        <YAxis tickFormatter={fmtM} stroke="#D8CFBC" tick={axisTick} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
          formatter={(value, n) => [`$${Math.round(Number(value)).toLocaleString("es-CL")}`, n]}
        />
        <Legend wrapperStyle={{ color: "#8A8172", fontSize: 12, paddingTop: 10 }} />
        <ReferenceLine y={0} stroke="#D8CFBC" strokeWidth={1} />
        <ReferenceLine x={opt.pStar} stroke="#B8562E" strokeDasharray="5 3" strokeWidth={1.5}
          label={{ value: `P*`, fill: "#B8562E", fontSize: 11, position: "insideTopLeft" }} />
        {opt.hasBreakEven && (
          <>
            <ReferenceLine x={opt.breakEven1} stroke="#C99A3E" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine x={opt.breakEven2} stroke="#C99A3E" strokeDasharray="3 3" strokeWidth={1} />
          </>
        )}
        <Line type="monotone" dataKey="ip" name="I(P) Ingresos"  stroke="#5B7FA6" strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="cp" name="C(P) Costos"    stroke="#A6453D" strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="bp" name="B(P) Beneficio" stroke="#3E6259" strokeWidth={2.5} dot={false} />
      </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ElasticityChart() {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt || !opt.isValid) return null

  const pMin = opt.hasBreakEven ? Math.max(1, opt.breakEven1 * 0.8) : opt.pStar * 0.5
  const pMax = opt.hasBreakEven ? opt.breakEven2 * 1.05 : opt.pStar * 1.5
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A8172]">
        <span>
          E(P*) = <span className="font-mono font-bold text-[#3E6259]">{opt.eStar.toFixed(3)}</span>
        </span>
        <span className="text-[#D8CFBC]">·</span>
        <span className={Math.abs(opt.eStar) > 1 ? "text-[#3E6259]" : "text-[#C99A3E]"}>
          {Math.abs(opt.eStar) > 1
            ? "Demanda elástica — subir el precio reduce los ingresos"
            : "Demanda inelástica — el precio no mueve mucho la cantidad"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D2" />
          <XAxis dataKey="p" tickFormatter={fmtP} stroke="#D8CFBC" tick={axisTick}
            label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, ...axisLabel }} />
          <YAxis domain={[-8, 0]} allowDataOverflow stroke="#D8CFBC" tick={axisTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
            formatter={(value) => [Number(value).toFixed(3), "E(P)"]}
          />
          <ReferenceLine y={-1} stroke="#C99A3E" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "E = −1  frontera elástica", fill: "#C99A3E", fontSize: 10, position: "right" }} />
          <ReferenceLine x={opt.pStar} stroke="#B8562E" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "P*", fill: "#B8562E", fontSize: 11, position: "insideTopLeft" }} />
          <Line type="monotone" dataKey="ep" name="E(P)" stroke="#8570A6" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
