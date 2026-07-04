"use client"
import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

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
        <span className="text-sm text-[#5c5346]">{label}</span>
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-32 text-right font-mono text-sm bg-white border border-[#E8E1D2] rounded px-2 py-1 text-[#B8562E] focus:outline-none focus:border-[#B8562E]"
        />
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className={`[&_[role=slider]]:${color} [&_.bg-primary]:bg-current`}
      />
      <p className="text-xs text-[#a89f8f]">{hint}</p>
    </div>
  )
}

export function SensitivityPanel() {
  const { cf, cv, opt, reg, setCosts, scenarios, addScenario, removeScenario, clearScenarios } = useStore()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <CostInput
          label="Costo Fijo (CF) — mensual"
          value={cf} min={10000} max={1000000} step={5000}
          color="bg-[#B8562E]"
          onChange={v => setCosts(v, cv)}
          hint="Arriendo, sueldos fijos, etc. · No afecta P*"
        />
        <CostInput
          label="Costo Variable (cv) — por unidad"
          value={cv} min={100} max={20000} step={100}
          color="bg-[#5B7FA6]"
          onChange={v => setCosts(cf, v)}
          hint="Insumos, embalaje, etc. · Desplaza P* en $cv/2"
        />
      </div>

      {opt && reg && opt.isValid && (
        <div className="rounded-xl border border-[#E8E1D2] bg-white p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8A8172] uppercase tracking-widest">Impacto en tiempo real</p>
            <Button size="sm" onClick={() => addScenario()}
              className="bg-[#3E6259] hover:bg-[#345349] text-white h-8">
              + Guardar escenario
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-[#8A8172] mb-1">P* óptimo</p>
              <p className="font-mono text-[#B8562E] font-bold text-lg">{clp(opt.pStar)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A8172] mb-1">B* beneficio</p>
              <p className="font-mono text-[#3E6259] font-bold text-lg">{clp(opt.bStar)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A8172] mb-1">Q* unidades</p>
              <p className="font-mono text-[#5B7FA6] font-bold text-lg">{Math.round(opt.qStar)}</p>
            </div>
          </div>
          <div className="border-t border-[#E8E1D2] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#8A8172]">
            <p className="cursor-help" title="Si subes o bajas el Costo Fijo, el precio óptimo P* no se mueve — solo cambia cuánto ganas en total.">
              ∂P*/∂CF = <span className="font-mono text-[#5c5346]">0</span> — P* no depende de CF
            </p>
            <p className="cursor-help" title="Por cada peso que sube el Costo Variable, el precio óptimo P* sube esta cantidad.">
              ∂P*/∂cv = <span className="font-mono text-[#5c5346]">+{(1 / (2 * reg.b)).toFixed(0)}</span> — por cada $1 en cv
            </p>
          </div>
        </div>
      )}

      {/* ── Comparador de escenarios ── */}
      {scenarios.length > 0 && (
        <div className="animate-fade-up rounded-xl border border-[#E8E1D2] bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8A8172] uppercase tracking-widest">
              Escenarios guardados ({scenarios.length})
            </p>
            <button onClick={clearScenarios} className="text-xs text-[#a89f8f] hover:text-[#A6453D] transition-colors">
              Limpiar todo
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#E8E1D2]">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-[#F7F2E9]">
                <tr>
                  <th className="px-3 py-2 text-left text-[#8A8172] font-medium">Escenario</th>
                  <th className="px-3 py-2 text-right text-[#8A8172] font-medium">CF</th>
                  <th className="px-3 py-2 text-right text-[#8A8172] font-medium">cv</th>
                  <th className="px-3 py-2 text-right text-[#8A8172] font-medium">P*</th>
                  <th className="px-3 py-2 text-right text-[#8A8172] font-medium">Q*</th>
                  <th className="px-3 py-2 text-right text-[#8A8172] font-medium">B*</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const best = Math.max(...scenarios.map(x => x.bStar))
                  const isBest = s.bStar === best && scenarios.length > 1
                  return (
                    <tr key={s.id} className="border-t border-[#E8E1D2] hover:bg-[#F7F2E9]/60">
                      <td className="px-3 py-2 text-[#5c5346]">
                        {s.label}
                        {isBest && <span className="ml-2 text-[10px] text-[#3E6259]">★ mejor B*</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#8A8172]">{clp(s.cf)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[#8A8172]">{clp(s.cv)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[#B8562E]">{clp(s.pStar)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[#5B7FA6]">{Math.round(s.qStar)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${isBest ? "text-[#2d4941] font-semibold" : "text-[#3E6259]"}`}>{clp(s.bStar)}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeScenario(s.id)}
                          className="text-[#a89f8f] hover:text-[#A6453D] transition-colors" title="Eliminar">
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#a89f8f]">
            Ajusta CF y cv arriba y presiona <span className="text-[#3E6259]">Guardar escenario</span> para comparar combinaciones lado a lado.
          </p>
        </div>
      )}
    </div>
  )
}
