import type { RegressionResult, OptimumResult, DataPoint } from "./math"

const INTEGRANTES = [
  "Francisco Parra",
  "Joaquín Álamos",
  "Guido Zapata",
  "Luis Cortes",
  "Alejandro Jara",
]

// Paleta (RGB) alineada con la app y la presentación PPTX
const C = {
  ink: [43, 38, 32] as [number, number, number],       // #2B2620
  slate: [138, 129, 114] as [number, number, number],  // #8A8172
  orange: [184, 86, 46] as [number, number, number],   // #B8562E terracota
  blue: [91, 127, 166] as [number, number, number],    // #5B7FA6
  teal: [62, 98, 89] as [number, number, number],      // #3E6259
  green: [62, 98, 89] as [number, number, number],
  line: [232, 225, 210] as [number, number, number],   // #E8E1D2
  navy: [43, 38, 32] as [number, number, number],       // #2B2620 (portada oscura)
}

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

interface ReportInput {
  productName: string
  reg: RegressionResult
  opt: OptimumResult
  cf: number
  cv: number
  data: DataPoint[]
}

export async function exportReport(input: ReportInput) {
  const { productName, reg, opt, cf, cv, data } = input
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48 // margen
  let y = 0

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])

  const ensureSpace = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage()
      y = M
    }
  }

  // ── Portada ──────────────────────────────────────────────
  setFill(C.navy)
  doc.rect(0, 0, W, 190, "F")
  setFill(C.orange)
  doc.rect(0, 190, W, 5, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text("Optimización de Precios Dinámicos", M, 78)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(216, 207, 188)
  doc.text("Cálculo Diferencial · ABPro · INACAP 2026", M, 100)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(217, 139, 95)
  doc.text(productName, M, 138)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(184, 174, 156)
  const hoy = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
  doc.text(`Informe generado: ${hoy}`, M, 162)

  y = 230

  // Integrantes
  setColor(C.slate)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Integrantes", M, y)
  y += 16
  doc.setFont("helvetica", "normal")
  setColor(C.ink)
  INTEGRANTES.forEach((n) => {
    doc.text(`•  ${n}`, M + 6, y)
    y += 15
  })
  y += 14

  // ── Caja de resultados clave ─────────────────────────────
  const boxH = 128
  setFill([247, 242, 233])
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.roundedRect(M, y, W - 2 * M, boxH, 8, 8, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  setColor(C.ink)
  doc.text("Resultados del modelo", M + 16, y + 24)

  const col = (x: number, label: string, value: string, c: [number, number, number]) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    setColor(C.slate)
    doc.text(label, x, y + 50)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    setColor(c)
    doc.text(value, x, y + 70)
  }
  const cw = (W - 2 * M) / 4
  col(M + 16, "PRECIO ÓPTIMO P*", clp(opt.pStar), C.orange)
  col(M + 16 + cw, "UNIDADES Q*", `${Math.round(opt.qStar)} u/mes`, C.blue)
  col(M + 16 + 2 * cw, "BENEFICIO B*", clp(opt.bStar), C.teal)
  col(M + 16 + 3 * cw, "ELASTICIDAD", opt.eStar.toFixed(3), C.green)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setColor(C.slate)
  doc.text(
    `Modelo de demanda:  Q(P) = ${reg.a.toFixed(2)} − ${reg.b.toFixed(4)}·P     (R² = ${reg.r2.toFixed(4)})`,
    M + 16,
    y + boxH - 16
  )
  y += boxH + 26

  // ── Datos históricos ─────────────────────────────────────
  ensureSpace(60 + data.length * 18)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  setColor(C.ink)
  doc.text("1. Datos históricos de ventas", M, y)
  y += 22

  const tW = W - 2 * M
  const c1 = M, c2 = M + tW * 0.18, c3 = M + tW * 0.5
  setFill(C.navy)
  doc.rect(M, y - 12, tW, 20, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text("#", c1 + 8, y + 2)
  doc.text("Precio P (CLP)", c2 + 8, y + 2)
  doc.text("Unidades Q", c3 + 8, y + 2)
  y += 14

  doc.setFont("helvetica", "normal")
  data.forEach((d, i) => {
    if (i % 2 === 1) {
      setFill([242, 236, 224])
      doc.rect(M, y - 10, tW, 18, "F")
    }
    setColor(C.slate)
    doc.text(`${i + 1}`, c1 + 8, y + 3)
    setColor(C.ink)
    doc.text(clp(d.p), c2 + 8, y + 3)
    doc.text(`${d.q}`, c3 + 8, y + 3)
    y += 18
  })
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.line(M, y, M + tW, y)
  y += 28

  // ── Desarrollo algebraico ────────────────────────────────
  ensureSpace(220)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  setColor(C.ink)
  doc.text("2. Desarrollo algebraico", M, y)
  y += 20

  const coefB = (reg.a + cv * reg.b).toFixed(2)
  const coefC = (cf + cv * reg.a).toFixed(0)
  const deriv2b = (2 * reg.b).toFixed(4)

  const steps: [string, string][] = [
    ["Demanda", `Q(P) = ${reg.a.toFixed(2)} − ${reg.b.toFixed(4)}·P`],
    ["Ingreso", `I(P) = P·Q(P) = ${reg.a.toFixed(2)}P − ${reg.b.toFixed(4)}P²`],
    ["Costo", `C(P) = CF + cv·Q(P) = ${clp(cf)} + ${clp(cv)}·Q`],
    ["Beneficio", `B(P) = −${reg.b.toFixed(4)}P² + ${coefB}P − ${coefC}`],
    ["Derivada", `B'(P) = −${deriv2b}P + ${coefB} = 0`],
    ["Óptimo", `P* = ${clp(opt.pStar)}`],
    ["2ª derivada", `B''(P) = −${deriv2b} < 0  →  máximo confirmado`],
    ["Break-even", opt.hasBreakEven
      ? `P₁ = ${clp(opt.breakEven1)}   ·   P₂ = ${clp(opt.breakEven2)}`
      : `No existe: B(P) < 0 para todo precio`],
  ]

  setFill([247, 242, 233])
  const algH = steps.length * 22 + 20
  doc.roundedRect(M, y, tW, algH, 6, 6, "F")
  y += 22
  steps.forEach(([label, expr], i) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    setColor(C.slate)
    doc.text(label.toUpperCase(), M + 14, y)
    doc.setFont("courier", "normal")
    doc.setFontSize(10)
    setColor(i >= 5 ? C.orange : C.ink)
    doc.text(expr, M + 110, y)
    y += 22
  })
  y += 24

  // ── Gráficas capturadas del DOM (si existen) ─────────────
  const chartsRoot = typeof document !== "undefined" ? document.getElementById("pdf-charts") : null
  if (chartsRoot) {
    const html2canvas = (await import("html2canvas")).default
    const cards = Array.from(chartsRoot.querySelectorAll<HTMLElement>("[data-pdf-chart]"))

    if (cards.length) {
      doc.addPage()
      y = M
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      setColor(C.ink)
      doc.text("3. Gráficas del modelo", M, y)
      y += 20

      for (const card of cards) {
        const canvas = await html2canvas(card, { backgroundColor: "#ffffff", scale: 1.5 })
        const imgW = W - 2 * M
        const imgH = (canvas.height / canvas.width) * imgW
        ensureSpace(imgH + 16)
        doc.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", M, y, imgW, imgH)
        y += imgH + 18
      }
    }
  }

  // ── Conclusiones ─────────────────────────────────────────
  ensureSpace(160)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  setColor(C.ink)
  doc.text("4. Conclusiones", M, y)
  y += 20

  const elast = Math.abs(opt.eStar) > 1
  const concl = [
    `El precio que maximiza el beneficio mensual es P* = ${clp(opt.pStar)}, obtenido al derivar la función de beneficio B(P) e igualarla a cero. La segunda derivada B''(P) = −${deriv2b} < 0 confirma que se trata de un máximo.`,
    `A ese precio se venden Q* = ${Math.round(opt.qStar)} unidades al mes, generando un beneficio óptimo de B* = ${clp(opt.bStar)}.`,
    `La elasticidad precio-demanda en el óptimo es E(P*) = ${opt.eStar.toFixed(3)}, lo que indica una demanda ${elast ? "elástica" : "inelástica"}: ${elast ? "una baja de precio incrementa el ingreso total." : "el precio influye poco en la cantidad vendida."}`,
    opt.hasBreakEven
      ? `El negocio es rentable dentro del intervalo de precios ${clp(opt.breakEven1)} – ${clp(opt.breakEven2)} (puntos de equilibrio), y P* se ubica correctamente dentro de ese rango.`
      : `Con la estructura de costos actual, el beneficio B(P) es negativo para cualquier precio: no existe un intervalo de precios rentable.`,
  ]
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(C.ink)
  concl.forEach((p) => {
    const lines = doc.splitTextToSize(p, tW)
    ensureSpace(lines.length * 14 + 8)
    doc.text(lines, M, y)
    y += lines.length * 14 + 8
  })

  // ── Pie de página en todas las hojas ─────────────────────
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(C.line[0], C.line[1], C.line[2])
    doc.line(M, H - 32, W - M, H - 32)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    setColor(C.slate)
    doc.text("Optimizador de Precios Dinámicos · INACAP 2026", M, H - 18)
    doc.text(`Página ${i} de ${pages}`, W - M, H - 18, { align: "right" })
  }

  const safeName = productName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "informe"

  // doc.save() de jsPDF dispara un <a download> desconectado del DOM: en
  // varios navegadores el click sintético no inicia la descarga. Se arma
  // el enlace a mano y se conecta al DOM antes de hacer click.
  const blob = doc.output("blob")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `Informe_${safeName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
