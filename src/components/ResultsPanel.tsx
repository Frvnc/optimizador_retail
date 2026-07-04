"use client"
import { useStore } from "@/lib/store"
import { InfoTerm } from "@/components/InfoTerm"
import { SectionHelp } from "@/components/SectionHelp"

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

function Step({ n, title, help, children, highlight }: {
  n: number; title: React.ReactNode; help?: React.ReactNode; children: React.ReactNode; highlight?: boolean
}) {
  return (
    <div className={`animate-fade-up flex gap-3 rounded-xl border p-4 stagger-${n <= 4 ? n : 4} ${
      highlight
        ? "border-[#B8562E]/40 bg-[#B8562E]/[0.05]"
        : "border-[#E8E1D2] bg-white"
    }`}>
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        highlight ? "bg-[#B8562E] text-white" : "bg-[#F0EAdc] text-[#8A8172]"
      }`}>
        {n}
      </div>
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[#8A8172]">
          {title}
          {help && <SectionHelp>{help}</SectionHelp>}
        </div>
        <div className="font-mono text-sm sm:text-base text-[#2B2620] leading-relaxed break-words">{children}</div>
      </div>
    </div>
  )
}

export function ResultsPanel() {
  const { opt, reg, cf, cv } = useStore()

  if (!opt || !reg) {
    return (
      <div className="rounded-xl border border-dashed border-[#E8E1D2] p-8 text-center text-[#8A8172] text-sm">
        Ingresa datos y presiona <span className="text-[#B8562E]">Calcular</span> para ver los resultados
      </div>
    )
  }

  if (!opt.isValid) {
    return (
      <div className="rounded-xl border border-dashed border-[#d9b3ac] bg-[#A6453D]/[0.05] p-8 text-center text-[#8a382f] text-sm">
        El modelo no tiene un óptimo válido con estos datos (pendiente de demanda b = {reg.b.toFixed(4)}).
        Revisa la tabla de datos.
      </div>
    )
  }

  const coefB = (reg.a + cv * reg.b).toFixed(2)
  const coefC = (cf + cv * reg.a).toFixed(0)
  const deriv2b = (2 * reg.b).toFixed(4)

  return (
    <div className="space-y-3">
      <Step n={1} title="Función de demanda (regresión lineal)" help={<>
        <p><b>Qué hace:</b> estima cuántas unidades (Q) se venderían para cada precio (P) posible, a partir de tus datos históricos de ventas.</p>
        <p><b>Cómo se obtiene:</b> es una regresión lineal simple sobre tus pares (Precio, Unidades) — busca la recta que mejor se ajusta a los puntos.</p>
        <p>El <InfoTerm text="Qué tan bien el modelo predice tus ventas reales. Va de 0 a 1: más cerca de 1 es mejor.">R²</InfoTerm> te dice qué tan confiable es ese ajuste.</p>
      </>}>
        <span className="text-[#8A8172]">Q(P) = </span>
        <span className="text-[#5B7FA6]">{reg.a.toFixed(2)}</span>
        <span className="text-[#8A8172]"> − </span>
        <span className="text-[#5B7FA6]">{reg.b.toFixed(4)}</span>
        <span className="text-[#8A8172]">·P</span>
        <span className="ml-2 text-xs text-[#3E6259]">
          (R² = {reg.r2.toFixed(4)})
        </span>
      </Step>

      <Step n={2} title="Ingreso total  I(P) = P · Q(P)" help={<>
        <p><b>Qué hace:</b> calcula todo el dinero que entra por ventas a cada precio.</p>
        <p><b>Cómo se obtiene:</b> multiplica el precio (P) por la cantidad que se vendería a ese precio, según la función de demanda del Paso 1 — por eso queda en función de P².</p>
      </>}>
        <span className="text-[#8A8172]">I(P) = </span>
        <span className="text-[#5B7FA6]">{reg.a.toFixed(2)}P − {reg.b.toFixed(4)}P²</span>
      </Step>

      <Step n={3} title="Costo total  C(P) = CF + cv · Q(P)" help={<>
        <p><b>Qué hace:</b> calcula lo que cuesta operar el negocio a cada precio.</p>
        <p><b>Cómo se obtiene:</b> suma el Costo Fijo (CF, no cambia aunque vendas más o menos) más el Costo Variable (cv) por cada unidad vendida, usando otra vez la demanda Q(P) del Paso 1.</p>
      </>}>
        <span className="text-[#8A8172]">C(P) = </span>
        <span className="text-[#A6453D]">{clp(cf)} + {clp(cv)}·Q</span>
      </Step>

      <Step n={4} title="Beneficio  B(P) = I(P) − C(P)" help={<>
        <p><b>Qué hace:</b> calcula la ganancia real a cada precio.</p>
        <p><b>Cómo se obtiene:</b> resta el costo total (Paso 3) al ingreso total (Paso 2). Es la función que queremos maximizar.</p>
      </>}>
        <span className="text-[#8A8172]">B(P) = </span>
        <span className="text-[#3E6259]">−{reg.b.toFixed(4)}P² + {coefB}P − {coefC}</span>
      </Step>

      <Step n={5} title="Condición de óptimo  B′(P) = 0" help={<>
        <p><b>Qué hace:</b> encuentra el precio donde la ganancia deja de subir (ni sube ni baja).</p>
        <p><b>Cómo se obtiene:</b> se deriva B(P) del Paso 4 respecto a P y se iguala a cero. Como B(P) es una parábola hacia abajo, ese punto es el máximo.</p>
      </>}>
        <span className="text-[#8A8172]">B′(P) = </span>
        <span className="text-[#2B2620]">−{deriv2b}P + {coefB} = 0</span>
      </Step>

      <Step n={6} title="Precio óptimo" help={<>
        <p><b>Qué hace:</b> es el precio al que te conviene vender — el que te da la mayor ganancia posible según el modelo.</p>
        <p><b>Cómo se obtiene:</b> se despeja P de la ecuación B′(P) = 0 del Paso 5.</p>
      </>} highlight>
        <span className="text-[#8A8172]">P* = (a + cv·b) / (2b) = </span>
        <span className="text-[#B8562E] font-bold text-lg">{clp(opt.pStar)}</span>
      </Step>

      <Step n={7} title="Criterio de la segunda derivada" help={<>
        <p><b>Qué hace:</b> confirma que el precio óptimo P* encontrado en el Paso 6 es realmente un máximo (la mayor ganancia) y no un mínimo.</p>
        <p><b>Cómo se obtiene:</b> se deriva B′(P) del Paso 5 una vez más. Si el resultado B″(P) es negativo, la parábola abre hacia abajo — confirma que es un máximo.</p>
      </>}>
        <span className="text-[#8A8172]">B″(P) = </span>
        <span className="text-[#2B2620]">−{deriv2b} &lt; 0</span>
        <span className="ml-2 text-[#3E6259]">✓ es un máximo</span>
      </Step>

      {/* Break-even + verificación */}
      {opt.hasBreakEven ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-[#E8E1D2] bg-white p-4">
            <p className="text-xs text-[#8A8172] uppercase tracking-wide mb-2">Puntos de equilibrio (B = 0)</p>
            <p className="font-mono text-sm text-[#5c5346]">
              P₁ = <span className="text-[#C99A3E]">{clp(opt.breakEven1)}</span>
            </p>
            <p className="font-mono text-sm text-[#5c5346]">
              P₂ = <span className="text-[#C99A3E]">{clp(opt.breakEven2)}</span>
            </p>
          </div>
          <div className="rounded-xl border border-[#E8E1D2] bg-white p-4">
            <p className="text-xs text-[#8A8172] uppercase tracking-wide mb-2">Verificación</p>
            <p className="font-mono text-sm text-[#5c5346]">
              {Math.round(opt.breakEven1).toLocaleString("es-CL")} &lt;{" "}
              <span className="text-[#B8562E]">{Math.round(opt.pStar).toLocaleString("es-CL")}</span>{" "}
              &lt; {Math.round(opt.breakEven2).toLocaleString("es-CL")}
            </p>
            <p className="text-xs text-[#3E6259] mt-1">P* está dentro del intervalo de ganancia ✓</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#d9b3ac] bg-[#A6453D]/[0.05] p-4 pt-1">
          <p className="text-xs text-[#8a382f] uppercase tracking-wide mb-2 mt-3">Puntos de equilibrio (B = 0)</p>
          <p className="text-sm text-[#8a382f]">
            No existen: B(P) es negativo para todo precio (B* = {clp(opt.bStar)}). El negocio no es rentable con estos costos.
          </p>
        </div>
      )}
    </div>
  )
}
