"use client"
import { useStore } from "@/lib/store"

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-1">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

export function ResultsPanel() {
  const { opt, reg, cf, cv } = useStore()

  if (!opt || !reg) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500 text-sm">
        Ingresa datos y presiona <span className="text-orange-400">Calcular</span> para ver los resultados
      </div>
    )
  }

  const coefB = (reg.a + cv * reg.b).toFixed(2)
  const coefC = (cf + cv * reg.a).toFixed(0)
  const deriv2b = (2 * reg.b).toFixed(4)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Precio óptimo P*" value={clp(opt.pStar)} sub="CLP por unidad" color="text-orange-400" />
        <StatCard label="Unidades Q*" value={Math.round(opt.qStar).toString()} sub="unidades/mes" color="text-blue-400" />
        <StatCard label="Beneficio B*" value={clp(opt.bStar)} sub="CLP/mes" color="text-teal-400" />
        <StatCard
          label="Elasticidad E(P*)"
          value={opt.eStar.toFixed(3)}
          sub={Math.abs(opt.eStar) > 1 ? "Demanda elástica ✓" : "Demanda inelástica"}
          color={Math.abs(opt.eStar) > 1 ? "text-green-400" : "text-yellow-400"}
        />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-2">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide mb-3">Desarrollo algebraico</h4>
        <div className="font-mono text-sm space-y-1.5 text-slate-300">
          <p><span className="text-slate-500">Q(P) =</span> {reg.a.toFixed(2)} − {reg.b.toFixed(4)}·P &nbsp;<span className="text-slate-500">(R²={reg.r2.toFixed(4)})</span></p>
          <p><span className="text-slate-500">I(P) =</span> {reg.a.toFixed(2)}P − {reg.b.toFixed(4)}P²</p>
          <p><span className="text-slate-500">B(P) =</span> −{reg.b.toFixed(4)}P² + {coefB}P − {coefC}</p>
          <p><span className="text-slate-500">B&apos;(P) =</span> −{deriv2b}P + {coefB} = 0</p>
          <p className="text-orange-400 font-semibold">P* = {opt.pStar.toFixed(0)} CLP</p>
          <p>
            <span className="text-slate-500">B&apos;&apos;(P) =</span> −{deriv2b} &lt; 0
            &nbsp;<span className="text-green-400">✓ máximo confirmado</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Break-even</p>
          <p className="font-mono text-sm text-slate-300">
            P₁ = <span className="text-yellow-400">{Math.round(opt.breakEven1).toLocaleString("es-CL")} CLP</span>
          </p>
          <p className="font-mono text-sm text-slate-300">
            P₂ = <span className="text-yellow-400">{Math.round(opt.breakEven2).toLocaleString("es-CL")} CLP</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Verificación</p>
          <p className="text-sm text-slate-300">
            {Math.round(opt.breakEven1).toLocaleString()} &lt;{" "}
            <span className="text-orange-400">{Math.round(opt.pStar).toLocaleString()}</span>{" "}
            &lt; {Math.round(opt.breakEven2).toLocaleString()}
          </p>
          <p className="text-xs text-green-400 mt-1">P* dentro del intervalo de ganancia ✓</p>
        </div>
      </div>
    </div>
  )
}
