"use client"
import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

function CostInput({
  label, value, min, max, step, color, onChange, hint
}: {
  label: string; value: number; min: number; max: number; step: number
  color: string; onChange: (v: number) => void; hint: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-32 text-right font-mono text-sm bg-slate-900 border border-slate-600 rounded px-2 py-1 text-orange-400 focus:outline-none focus:border-orange-500"
        />
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className={`[&_[role=slider]]:${color} [&_.bg-primary]:bg-current`}
      />
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  )
}

export function SensitivityPanel() {
  const { cf, cv, opt, reg, setCosts } = useStore()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <CostInput
          label="Costo Fijo (CF) — mensual"
          value={cf} min={10000} max={1000000} step={5000}
          color="bg-orange-400"
          onChange={v => setCosts(v, cv)}
          hint="Arriendo, sueldos fijos, etc. · No afecta P*"
        />
        <CostInput
          label="Costo Variable (cv) — por unidad"
          value={cv} min={100} max={20000} step={100}
          color="bg-blue-400"
          onChange={v => setCosts(cf, v)}
          hint="Insumos, embalaje, etc. · Desplaza P* en $cv/2"
        />
      </div>

      {opt && reg && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Impacto en tiempo real</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">P* óptimo</p>
              <p className="font-mono text-orange-400 font-bold text-lg">{clp(opt.pStar)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">B* beneficio</p>
              <p className="font-mono text-teal-400 font-bold text-lg">{clp(opt.bStar)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Q* unidades</p>
              <p className="font-mono text-blue-400 font-bold text-lg">{Math.round(opt.qStar)}</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-4 text-xs text-slate-500">
            <p>∂P*/∂CF = <span className="font-mono text-slate-400">0</span> — P* no depende de CF</p>
            <p>∂P*/∂cv = <span className="font-mono text-slate-400">+{(1 / (2 * reg.b)).toFixed(0)}</span> — por cada $1 en cv</p>
          </div>
        </div>
      )}
    </div>
  )
}
