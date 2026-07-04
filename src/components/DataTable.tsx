"use client"
import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { DataPoint } from "@/lib/math"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { InfoTerm } from "@/components/InfoTerm"
import { SectionHelp } from "@/components/SectionHelp"
import { RotateCcw } from "lucide-react"

const DEMO: DataPoint[] = [
  { p: 5000, q: 178 }, { p: 5500, q: 167 }, { p: 6000, q: 154 }, { p: 6500, q: 142 },
  { p: 7000, q: 130 }, { p: 7500, q: 118 }, { p: 8000, q: 106 }, { p: 8500, q: 93 },
]

type Flash = { text: string; kind: "ok" | "error" }

export function DataTable() {
  const { data, setData, reg, productName, setProductName, resetAll } = useStore()
  const [rows, setRows] = useState<DataPoint[]>(data)
  const [msg, setMsg] = useState<Flash | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Resincroniza la copia editable cuando el store cambia por fuera (p. ej. al rehidratar desde localStorage)
  useEffect(() => { setRows(data) }, [data])

  const isDemoData = JSON.stringify(data) === JSON.stringify(DEMO)
  const dirty = JSON.stringify(rows) !== JSON.stringify(data)
  const invalidRows = rows.filter((r) => r.p !== 0 && (r.p < 0 || r.q < 0 || !Number.isFinite(r.p) || !Number.isFinite(r.q)))
  const validCount = rows.filter((r) => r.p > 0 && r.q > 0).length
  const canApply = validCount >= 3 && invalidRows.length === 0

  const update = (i: number, field: "p" | "q", val: string) => {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: Number(val) } : r)))
  }

  const apply = () => {
    const clean = rows.filter((r) => r.p > 0 && r.q > 0)
    if (clean.length < 3) {
      flash("Se necesitan al menos 3 pares (Precio, Unidades) válidos y mayores a cero.", "error")
      return
    }
    setData(clean)
    setRows(clean)
    flash(`Regresión calculada con ${clean.length} puntos`, "ok")
  }

  const addRow = () => setRows([...rows, { p: 0, q: 0 }])
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i))

  const loadDemo = () => {
    setRows(DEMO)
    setData(DEMO)
    setProductName("Café de Especialidad 250g")
    flash("Datos de ejemplo (Café 250g) cargados", "ok")
  }

  const handleReset = () => {
    if (window.confirm("¿Restablecer todo? Se borrarán el nombre del producto, los datos, los costos y los escenarios guardados en este navegador.")) {
      resetAll()
      flash("Todo restablecido — completa tus propios datos", "ok")
    }
  }

  const flash = (t: string, kind: Flash["kind"] = "ok") => {
    setMsg({ text: t, kind })
    setTimeout(() => setMsg(null), 3200)
  }

  // ── Importar CSV (Precio,Unidades por línea) ──
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const parsed: DataPoint[] = []
        text.split(/\r?\n/).forEach((line) => {
          const parts = line.split(/[,;\t]/).map((s) => Number(s.trim().replace(/[^\d.-]/g, "")))
          if (parts.length >= 2 && parts[0] > 0 && parts[1] > 0 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            parsed.push({ p: parts[0], q: parts[1] })
          }
        })
        if (parsed.length >= 3) {
          setRows(parsed)
          setData(parsed)
          flash(`${parsed.length} filas importadas desde ${file.name}`, "ok")
        } else {
          flash("No se detectaron al menos 3 pares (Precio, Unidades) válidos en el archivo.", "error")
        }
      } catch {
        flash("No se pudo leer el archivo. Verifica que sea un CSV de texto plano.", "error")
      } finally {
        setImporting(false)
      }
    }
    reader.onerror = () => {
      setImporting(false)
      flash("Error al leer el archivo.", "error")
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // ── Exportar CSV (Precio,Unidades) ──
  const exportCSV = () => {
    if (data.length === 0) {
      flash("No hay datos calculados para exportar todavía.", "error")
      return
    }
    const header = "Precio,Unidades"
    const lines = data.map((d) => `${d.p},${d.q}`)
    const csv = [header, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const safeName = productName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "datos"
    a.href = url
    a.download = `Datos_${safeName}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    flash(`${data.length} filas exportadas a CSV`, "ok")
  }

  return (
    <div className="space-y-5 animate-fade">
      {/* ── Nombre del producto ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-normal text-[#8A8172] uppercase tracking-wide">
          Producto analizado
        </label>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ej: Café de Especialidad 250g"
          className="h-10 bg-white border-[#E8E1D2] text-[#2B2620] font-medium max-w-md"
        />
        <p className="text-xs text-[#a89f8f]">Aparece en el encabezado, en los resultados y en el informe PDF.</p>
      </div>

      <div className="divider-fade" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[#2B2620]">
            Datos históricos de ventas
            <SectionHelp>
              <p><b>Qué es:</b> los pares Precio → Unidades vendidas que se usan para ajustar el modelo de demanda.</p>
              <p><b>Mínimo:</b> 3 pares válidos (precio y unidades mayores a cero) para poder calcular la regresión.</p>
              <p><b>Consejo:</b> mientras más variedad de precios históricos tengas, más confiable es el ajuste (mira el R² una vez calculado).</p>
            </SectionHelp>
            {isDemoData && (
              <Badge variant="outline" className="border-[#C99A3E] text-[#a17a1f] text-[10px] font-normal">
                Datos de ejemplo
              </Badge>
            )}
          </h3>
          <p className="text-xs text-[#8A8172]">
            {isDemoData
              ? "Estos son datos de ejemplo (Café 250g) — edítalos o reemplázalos por los tuyos abajo."
              : "Ingresa pares Precio → Unidades vendidas (mínimo 3)"}
          </p>
        </div>
        {reg && (
          <Badge variant="outline" className="border-[#3E6259] text-[#3E6259] w-fit">
            <InfoTerm text="Qué tan bien el modelo predice tus ventas reales. Va de 0 a 1: mientras más cerca de 1, más confiable es la regresión.">
              R²
            </InfoTerm> = {reg.r2.toFixed(4)}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-[#E8E1D2] overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-[#F7F2E9]">
            <tr>
              <th className="px-4 py-2 text-left text-[#8A8172] font-medium w-12">#</th>
              <th className="px-4 py-2 text-left text-[#8A8172] font-medium">Precio P (CLP)</th>
              <th className="px-4 py-2 text-left text-[#8A8172] font-medium">Unidades Q</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowInvalid = (row.p !== 0 && row.p < 0) || (row.q !== 0 && row.q < 0)
              return (
                <tr key={i} className="animate-fade-up border-t border-[#E8E1D2] hover:bg-[#F7F2E9]/60 transition-colors"
                  style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <td className="px-4 py-2 text-[#a89f8f] text-xs">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={row.p || ""}
                      onChange={(e) => update(i, "p", e.target.value)}
                      className={`h-8 rounded-lg bg-white text-[#2B2620] w-32 ${rowInvalid ? "border-[#A6453D] focus-visible:ring-[#A6453D]" : "border-[#E8E1D2]"}`}
                      placeholder="ej: 7500"
                      min={0}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={row.q || ""}
                      onChange={(e) => update(i, "q", e.target.value)}
                      className={`h-8 rounded-lg bg-white text-[#2B2620] w-28 ${rowInvalid ? "border-[#A6453D] focus-visible:ring-[#A6453D]" : "border-[#E8E1D2]"}`}
                      placeholder="ej: 118"
                      min={0}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeRow(i)}
                      className="rounded-md px-1.5 py-1 text-[#a89f8f] hover:text-[#A6453D] hover:bg-[#A6453D]/10 transition-colors text-xs"
                      title="Eliminar fila"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {invalidRows.length > 0 && (
        <p className="text-xs text-[#A6453D]">
          Hay {invalidRows.length} fila{invalidRows.length === 1 ? "" : "s"} con valores negativos o inválidos — corrígelas antes de calcular.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={addRow} variant="outline" size="sm"
          className="border-[#E8E1D2] text-[#5c5346] hover:bg-[#F7F2E9]">
          + Fila
        </Button>
        <Button onClick={() => fileRef.current?.click()} variant="outline" size="sm"
          disabled={importing}
          className="border-[#E8E1D2] text-[#5c5346] hover:bg-[#F7F2E9]">
          {importing ? "Importando…" : "Importar CSV"}
        </Button>
        <Button onClick={exportCSV} variant="outline" size="sm"
          className="border-[#E8E1D2] text-[#5c5346] hover:bg-[#F7F2E9]">
          Exportar CSV
        </Button>
        <Button onClick={loadDemo} variant="outline" size="sm"
          className="border-[#E8E1D2] text-[#5c5346] hover:bg-[#F7F2E9]">
          Datos de ejemplo
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm"
          title="Borra nombre, datos, costos y escenarios guardados en este navegador"
          className="border-[#E8E1D2] text-[#8A8172] hover:text-[#A6453D] hover:border-[#A6453D]/40 hover:bg-[#A6453D]/5">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restablecer todo
        </Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="hidden" />

        <Button onClick={apply} size="sm" disabled={!canApply}
          className={`ml-auto text-white transition-smooth disabled:opacity-40 ${dirty ? "bg-[#B8562E] hover:bg-[#a04a27] glow-accent" : "bg-[#B8562E]/85 hover:bg-[#a04a27]"}`}>
          {dirty ? "Calcular ●" : "Calcular"}
        </Button>
      </div>

      {msg && (
        <div className={`animate-fade-up rounded-lg border px-3 py-2 text-xs ${
          msg.kind === "ok"
            ? "border-[#bcd4cb] bg-[#3E6259]/[0.07] text-[#2d4941]"
            : "border-[#d9b3ac] bg-[#A6453D]/[0.07] text-[#8a382f]"
        }`}>
          {msg.text}
        </div>
      )}

      {reg && (
        <div className="rounded-lg bg-[#F7F2E9] border border-[#E8E1D2] p-3 font-mono text-sm">
          <span className="text-[#8A8172]">Q(P) = </span>
          <span className="text-[#5B7FA6]">{reg.a.toFixed(2)}</span>
          <span className="text-[#8A8172]"> − </span>
          <span className="text-[#5B7FA6]">{reg.b.toFixed(4)}</span>
          <span className="text-[#8A8172]">·P</span>
        </div>
      )}
    </div>
  )
}
