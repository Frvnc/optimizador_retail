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

export function RegressionChart() {
  const { data, reg } = useStore()
  if (!reg || data.length < 3) return null

  const band = buildRegressionBand(data, reg)

  // Inject actual data points into band dataset
  const dataMap = new Map(data.map(d => [d.p, d.q]))
  const combined = band.map(pt => ({
    ...pt,
    q_real: dataMap.get(pt.p) ?? null,
  }))

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { q_real: number | null } }) => {
    const { cx, cy, payload } = props
    if (!payload?.q_real || !cx || !cy) return <g />
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#fb923c" fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={5} fill="#fb923c" stroke="#fff" strokeWidth={1.5} />
      </g>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
          Datos reales ({data.length} puntos)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-blue-400" />
          Q(P) = {reg.a.toFixed(2)} − {reg.b.toFixed(4)}·P
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded bg-blue-400 opacity-20" />
          Intervalo confianza 95%
        </span>
        <span className="ml-auto font-mono text-teal-400 font-medium">R² = {reg.r2.toFixed(4)}</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={combined} margin={{ top: 10, right: 24, bottom: 24, left: 16 }}>
          <defs>
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="p" type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtP} stroke="#334155"
            tick={{ fill: "#64748b", fontSize: 11 }}
            label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }}
          />
          <YAxis
            stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }}
            label={{ value: "Unidades Q", angle: -90, position: "insideLeft", offset: 14, fill: "#475569", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
            labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
            formatter={(v: number, name: string) => {
              if (name === "q_real") return [`${v} uds`, "Dato real"]
              if (name === "q_reg")  return [`${v.toFixed(1)} uds`, "Modelo Q(P)"]
              return [null, null]
            }}
          />
          {/* Banda de confianza: upper rellena, lower enmascara con fondo */}
          <Area type="monotone" dataKey="q_upper" stroke="none" fill="url(#bandGrad)" legendType="none" tooltipType="none" />
          <Area type="monotone" dataKey="q_lower" stroke="none" fill="#070f1a" legendType="none" tooltipType="none" />
          {/* Línea de regresión */}
          <Line type="monotone" dataKey="q_reg"  stroke="#38bdf8" strokeWidth={2.5} dot={false} name="q_reg" />
          {/* Puntos reales */}
          <Line type="monotone" dataKey="q_real" stroke="none" dot={<CustomDot />}
            activeDot={{ r: 8, fill: "#fb923c" }} name="q_real" connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunctionsChart() {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt) return null

  const pMin = Math.max(100, opt.breakEven1 * 0.6)
  const pMax = opt.breakEven2 * 1.22
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 20 }}>
        <defs>
          <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="p" tickFormatter={fmtP} stroke="#334155"
          tick={{ fill: "#64748b", fontSize: 11 }}
          label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }} />
        <YAxis tickFormatter={fmtM} stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
          labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
          formatter={(v: number, n: string) => [`$${Math.round(v).toLocaleString("es-CL")}`, n]}
        />
        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12, paddingTop: 10 }} />
        <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
        <ReferenceLine x={opt.pStar} stroke="#fb923c" strokeDasharray="5 3" strokeWidth={1.5}
          label={{ value: `P*`, fill: "#fb923c", fontSize: 11, position: "insideTopLeft" }} />
        <ReferenceLine x={opt.breakEven1} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth={1} />
        <ReferenceLine x={opt.breakEven2} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth={1} />
        <Line type="monotone" dataKey="ip" name="I(P) Ingresos"  stroke="#38bdf8" strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="cp" name="C(P) Costos"    stroke="#f87171" strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="bp" name="B(P) Beneficio" stroke="#4ade80" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ElasticityChart() {
  const { reg, opt, cf, cv } = useStore()
  if (!reg || !opt) return null

  const pMin = Math.max(1, opt.breakEven1 * 0.8)
  const pMax = opt.breakEven2 * 1.05
  const curves = buildCurves(reg.a, reg.b, cf, cv, pMin, pMax)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>
          E(P*) = <span className="font-mono font-bold text-green-400">{opt.eStar.toFixed(3)}</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className={Math.abs(opt.eStar) > 1 ? "text-green-400" : "text-yellow-400"}>
          {Math.abs(opt.eStar) > 1
            ? "Demanda elástica — subir el precio reduce los ingresos"
            : "Demanda inelástica — el precio no mueve mucho la cantidad"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={curves} margin={{ top: 10, right: 24, bottom: 24, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="p" tickFormatter={fmtP} stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }}
            label={{ value: "Precio P (CLP)", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }} />
          <YAxis domain={[-8, 0]} stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
            labelFormatter={(p) => `P = $${Number(p).toLocaleString("es-CL")}`}
            formatter={(v: number) => [v.toFixed(3), "E(P)"]}
          />
          <ReferenceLine y={-1} stroke="#fbbf24" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "E = −1  frontera elástica", fill: "#fbbf2480", fontSize: 10, position: "right" }} />
          <ReferenceLine x={opt.pStar} stroke="#fb923c" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: "P*", fill: "#fb923c", fontSize: 11, position: "insideTopLeft" }} />
          <Line type="monotone" dataKey="ep" name="E(P)" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
