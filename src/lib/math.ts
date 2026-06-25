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

  const pStar = (a + cv * b) / (2 * b)
  const qStar = a - b * pStar
  const iStar = pStar * qStar
  const cStar = cf + cv * qStar
  const bStar = iStar - cStar
  const eStar = (-b * pStar) / qStar

  // Break-even: -b*P² + (a + cv*b)*P - (cf + cv*a) = 0
  const A2 = -b
  const B2 = a + cv * b
  const C2 = -(cf + cv * a)
  const disc = B2 * B2 - 4 * A2 * C2
  const breakEven1 = disc >= 0 ? (-B2 + Math.sqrt(disc)) / (2 * A2) : 0
  const breakEven2 = disc >= 0 ? (-B2 - Math.sqrt(disc)) / (2 * A2) : 0
  const be1 = Math.min(breakEven1, breakEven2)
  const be2 = Math.max(breakEven1, breakEven2)

  return { pStar, qStar, bStar, eStar, breakEven1: be1, breakEven2: be2 }
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
  const t = 2.045  // ~95% para df≈28; conservador para n pequeño

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
    const ep = q > 0 ? (-b * p) / q : 0
    points.push({ p, ip, cp, bp, ep })
  }
  return points
}
