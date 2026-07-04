export interface DataPoint {
  p: number
  q: number
}

export interface RegressionResult {
  a: number
  b: number
  r2: number
}

export interface OptimumResult {
  pStar: number
  qStar: number
  bStar: number
  eStar: number
  breakEven1: number
  breakEven2: number
  /** false si b <= 0 (demanda no decreciente) o P y Q óptimos no son positivos: el óptimo no tiene sentido económico */
  isValid: boolean
  /** false si la ecuación de beneficio no tiene raíces reales: no existe punto de equilibrio */
  hasBreakEven: boolean
}

export interface FunctionPoint {
  p: number
  ip: number
  cp: number
  bp: number
  ep: number
}

export function linearRegression(data: DataPoint[]): RegressionResult {
  const n = data.length
  const sumP = data.reduce((s, d) => s + d.p, 0)
  const sumQ = data.reduce((s, d) => s + d.q, 0)
  const sumPQ = data.reduce((s, d) => s + d.p * d.q, 0)
  const sumP2 = data.reduce((s, d) => s + d.p * d.p, 0)

  // Q = a - b*P  → ajuste: Q = A + B*P donde B = -b
  const B = (n * sumPQ - sumP * sumQ) / (n * sumP2 - sumP * sumP)
  const A = (sumQ - B * sumP) / n

  const a = A
  const b = -B

  // R²
  const qMean = sumQ / n
  const ssTot = data.reduce((s, d) => s + (d.q - qMean) ** 2, 0)
  const ssRes = data.reduce((s, d) => {
    const qPred = a - b * d.p
    return s + (d.q - qPred) ** 2
  }, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { a, b, r2 }
}

export interface QuadraticRegressionResult {
  a: number
  b: number
  c: number
  r2: number
}

/**
 * Regresión cuadrática Q(P) = a − b·P + c·P² por mínimos cuadrados, resolviendo
 * el sistema normal 3×3 con la regla de Cramer. Se usa solo para comparar el
 * ajuste contra el modelo lineal (R²) — el optimizador de precios sigue
 * trabajando exclusivamente con el modelo lineal en el resto de la app.
 */
export function quadraticRegression(data: DataPoint[]): QuadraticRegressionResult {
  const n = data.length
  let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0
  for (const d of data) {
    const x = d.p, y = d.q
    sx += x; sx2 += x * x; sx3 += x ** 3; sx4 += x ** 4
    sy += y; sxy += x * y; sx2y += x * x * y
  }

  // Sistema normal: M · [β0, β1, β2]ᵀ = v
  const M = [
    [n, sx, sx2],
    [sx, sx2, sx3],
    [sx2, sx3, sx4],
  ]
  const v = [sy, sxy, sx2y]

  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

  const replaceCol = (m: number[][], col: number, vec: number[]) =>
    m.map((row, i) => row.map((val, j) => (j === col ? vec[i] : val)))

  const D = det3(M)
  let beta0 = 0, beta1 = 0, beta2 = 0
  if (Math.abs(D) > 1e-9) {
    beta0 = det3(replaceCol(M, 0, v)) / D
    beta1 = det3(replaceCol(M, 1, v)) / D
    beta2 = det3(replaceCol(M, 2, v)) / D
  }

  const a = beta0, b = -beta1, c = beta2

  const qMean = sy / n
  const ssTot = data.reduce((s, d) => s + (d.q - qMean) ** 2, 0)
  const ssRes = data.reduce((s, d) => {
    const qPred = a - b * d.p + c * d.p * d.p
    return s + (d.q - qPred) ** 2
  }, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { a, b, c, r2 }
}

export function calcOptimum(
  a: number,
  b: number,
  cf: number,
  cv: number
): OptimumResult {
  // B(P) = I(P) - C(P)
  // I(P) = P*(a - b*P) = aP - bP²
  // C(P) = cf + cv*(a - b*P) = cf + cv*a - cv*b*P
  // B(P) = -b*P² + (a + cv*b)*P - (cf + cv*a)
  // B'(P) = -2b*P + (a + cv*b) = 0 → P* = (a + cv*b)/(2b)

  // b <= 0 significa que la regresión no arrojó una demanda decreciente en precio:
  // la fórmula P* = (a + cv·b)/(2b) pierde sentido (división por 0 o signo invertido).
  const pStar = b > 0 ? (a + cv * b) / (2 * b) : NaN
  const qStar = b > 0 ? a - b * pStar : NaN
  const iStar = pStar * qStar
  const cStar = cf + cv * qStar
  const bStar = iStar - cStar
  const eStar = (-b * pStar) / qStar
  const isValid = b > 0 && pStar > 0 && qStar > 0

  // Break-even: -b*P² + (a + cv*b)*P - (cf + cv*a) = 0
  const A2 = -b
  const B2 = a + cv * b
  const C2 = -(cf + cv * a)
  const disc = B2 * B2 - 4 * A2 * C2
  const hasBreakEven = disc >= 0 && A2 !== 0
  const breakEven1 = hasBreakEven ? (-B2 + Math.sqrt(disc)) / (2 * A2) : NaN
  const breakEven2 = hasBreakEven ? (-B2 - Math.sqrt(disc)) / (2 * A2) : NaN
  const be1 = hasBreakEven ? Math.min(breakEven1, breakEven2) : NaN
  const be2 = hasBreakEven ? Math.max(breakEven1, breakEven2) : NaN

  return { pStar, qStar, bStar, eStar, breakEven1: be1, breakEven2: be2, isValid, hasBreakEven }
}

// Valor crítico t de Student (dos colas, 95%) por grados de libertad.
// Tabla estándar para df pequeño; para df > 30 el valor converge a ~1.96 (normal).
const T_TABLE_95: Record<number, number> = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
}

function tCritical95(df: number): number {
  if (df < 1) return T_TABLE_95[1]
  if (df <= 30) return T_TABLE_95[Math.round(df)]
  if (df <= 40) return 2.021
  if (df <= 60) return 2.000
  if (df <= 120) return 1.980
  return 1.960
}

export interface RegressionBandPoint {
  p: number
  q_reg: number
  q_upper: number
  q_lower: number
  q_real: number | null
}

export function buildRegressionBand(
  data: DataPoint[],
  reg: RegressionResult,
  steps = 100
): RegressionBandPoint[] {
  const n = data.length
  const pMin = Math.min(...data.map(d => d.p)) * 0.88
  const pMax = Math.max(...data.map(d => d.p)) * 1.12
  const xMean = data.reduce((s, d) => s + d.p, 0) / n
  const Sxx = data.reduce((s, d) => s + (d.p - xMean) ** 2, 0)
  const ssRes = data.reduce((s, d) => {
    const qPred = reg.a - reg.b * d.p
    return s + (d.q - qPred) ** 2
  }, 0)
  const se = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0
  const t = n > 2 ? tCritical95(n - 2) : 0

  const dataMap = new Map(data.map(d => [d.p, d.q]))

  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = pMin + (i / steps) * (pMax - pMin)
    const q_reg = reg.a - reg.b * p
    const margin = t * se * Math.sqrt(1 / n + (p - xMean) ** 2 / Sxx)
    return {
      p,
      q_reg,
      q_upper: q_reg + margin,
      q_lower: Math.max(0, q_reg - margin),
      q_real: dataMap.get(p) ?? null,
    }
  })
}

export function buildCurves(
  a: number,
  b: number,
  cf: number,
  cv: number,
  pMin: number,
  pMax: number,
  steps = 120
): FunctionPoint[] {
  const points: FunctionPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const p = pMin + (i / steps) * (pMax - pMin)
    const q = a - b * p
    const ip = p * q
    const cp = cf + cv * q
    const bp = ip - cp
    // Cerca del precio de saturación (Q→0) E(P) diverge a -infinito; se acota
    // a un rango razonable para que el gráfico no reciba valores extremos.
    const epRaw = q > 0 ? (-b * p) / q : 0
    const ep = Number.isFinite(epRaw) ? Math.max(-50, Math.min(0, epRaw)) : 0
    points.push({ p, ip, cp, bp, ep })
  }
  return points
}
