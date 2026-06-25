"use client"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { DataPoint } from "@/lib/math"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function DataTable() {
  const { data, setData, reg } = useStore()
  const [rows, setRows] = useState<DataPoint[]>(data)

  const update = (i: number, field: "p" | "q", val: string) => {
    const next = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: Number(val) } : r
    )
    setRows(next)
  }

  const apply = () => setData(rows.filter((r) => r.p > 0 && r.q > 0))

  const addRow = () => setRows([...rows, { p: 0, q: 0 }])

  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-200">Datos históricos de ventas</h3>
          <p className="text-xs text-slate-400">Ingresa pares Precio → Unidades vendidas</p>
        </div>
        {reg && (
          <Badge variant="outline" className="border-teal-500 text-teal-400">
            R² = {reg.r2.toFixed(4)}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-2 text-left text-slate-400 font-medium">#</th>
              <th className="px-4 py-2 text-left text-slate-400 font-medium">Precio P (CLP)</th>
              <th className="px-4 py-2 text-left text-slate-400 font-medium">Unidades Q</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-2 text-slate-500 text-xs">{i + 1}</td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={row.p || ""}
                    onChange={(e) => update(i, "p", e.target.value)}
                    className="h-8 bg-slate-900 border-slate-600 text-slate-200 w-32"
                    placeholder="ej: 7500"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={row.q || ""}
                    onChange={(e) => update(i, "q", e.target.value)}
                    className="h-8 bg-slate-900 border-slate-600 text-slate-200 w-28"
                    placeholder="ej: 118"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => removeRow(i)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button onClick={addRow} variant="outline" size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-800">
          + Fila
        </Button>
        <Button onClick={apply} size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white">
          Calcular
        </Button>
      </div>

      {reg && (
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 font-mono text-sm">
          <span className="text-slate-400">Q(P) = </span>
          <span className="text-blue-400">{reg.a.toFixed(2)}</span>
          <span className="text-slate-400"> − </span>
          <span className="text-blue-400">{reg.b.toFixed(4)}</span>
          <span className="text-slate-400">·P</span>
        </div>
      )}
    </div>
  )
}
