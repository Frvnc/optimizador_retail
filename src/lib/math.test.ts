import { describe, it, expect } from "vitest"
import {
  linearRegression, calcOptimum, quadraticRegression,
  buildRegressionBand, buildCurves, DataPoint,
} from "./math"

// Función de beneficio reconstruida a partir de a,b,cf,cv — usada para
// verificar por propiedades (no solo por valores fijos) que el óptimo
// entregado por calcOptimum realmente maximiza B(P).
const benefit = (P: number, a: number, b: number, cf: number, cv: number) => {
  const Q = a - b * P
  return P * Q - (cf + cv * Q)
}

describe("linearRegression", () => {
  it("recupera exactamente a y b de un set de datos perfectamente lineal", () => {
    // Q = 100 - 2P
    const data: DataPoint[] = [1, 2, 3, 4, 5].map((p) => ({ p, q: 100 - 2 * p }))
    const { a, b, r2 } = linearRegression(data)
    expect(a).toBeCloseTo(100, 6)
    expect(b).toBeCloseTo(2, 6)
    expect(r2).toBeCloseTo(1, 6)
  })

  it("da R² menor a 1 cuando los datos tienen ruido", () => {
    const data: DataPoint[] = [
      { p: 1, q: 97 }, { p: 2, q: 96 }, { p: 3, q: 95 },
      { p: 4, q: 90 }, { p: 5, q: 91 },
    ]
    const { r2 } = linearRegression(data)
    expect(r2).toBeLessThan(1)
    expect(r2).toBeGreaterThan(0)
  })

  it("detecta pendiente negativa (b>0) cuando la demanda cae con el precio", () => {
    const data: DataPoint[] = [
      { p: 5000, q: 178 }, { p: 5500, q: 167 }, { p: 6000, q: 154 },
      { p: 6500, q: 142 }, { p: 7000, q: 130 },
    ]
    const { b } = linearRegression(data)
    expect(b).toBeGreaterThan(0)
  })
})

describe("calcOptimum", () => {
  const a = 100, b = 2, cf = 10, cv = 5

  it("el precio óptimo satisface la condición de primer orden B'(P*) = 0", () => {
    const { pStar } = calcOptimum(a, b, cf, cv)
    const derivative = -2 * b * pStar + (a + cv * b)
    expect(derivative).toBeCloseTo(0, 6)
  })

  it("P* es un máximo local real: el beneficio cae a ambos lados", () => {
    const { pStar, bStar } = calcOptimum(a, b, cf, cv)
    expect(bStar).toBeCloseTo(benefit(pStar, a, b, cf, cv), 6)
    expect(benefit(pStar, a, b, cf, cv)).toBeGreaterThan(benefit(pStar + 1, a, b, cf, cv))
    expect(benefit(pStar, a, b, cf, cv)).toBeGreaterThan(benefit(pStar - 1, a, b, cf, cv))
  })

  it("marca isValid=false cuando la pendiente de demanda no es positiva (b<=0)", () => {
    const r1 = calcOptimum(a, 0, cf, cv)
    const r2 = calcOptimum(a, -1, cf, cv)
    expect(r1.isValid).toBe(false)
    expect(r2.isValid).toBe(false)
    expect(Number.isNaN(r1.pStar)).toBe(true)
  })

  it("los puntos de equilibrio anulan el beneficio", () => {
    const { breakEven1, breakEven2, hasBreakEven } = calcOptimum(a, b, cf, cv)
    expect(hasBreakEven).toBe(true)
    expect(benefit(breakEven1, a, b, cf, cv)).toBeCloseTo(0, 4)
    expect(benefit(breakEven2, a, b, cf, cv)).toBeCloseTo(0, 4)
  })

  it("hasBreakEven=false cuando los costos fijos son demasiado altos para ser rentables", () => {
    const { hasBreakEven, isValid } = calcOptimum(a, b, 1_000_000_000, cv)
    expect(hasBreakEven).toBe(false)
    // el óptimo puede seguir siendo matemáticamente válido aunque no sea rentable
    expect(typeof isValid).toBe("boolean")
  })

  it("la elasticidad en el óptimo es negativa (demanda decreciente en precio)", () => {
    const { eStar } = calcOptimum(a, b, cf, cv)
    expect(eStar).toBeLessThan(0)
  })
})

describe("quadraticRegression", () => {
  it("recupera exactamente a, b, c de un set de datos perfectamente cuadrático", () => {
    // Q = 50 - 1*P + 0.1*P²
    const f = (p: number) => 50 - 1 * p + 0.1 * p * p
    const data: DataPoint[] = [1, 2, 3, 4, 5, 6].map((p) => ({ p, q: f(p) }))
    const { a, b, c, r2 } = quadraticRegression(data)
    expect(a).toBeCloseTo(50, 4)
    expect(b).toBeCloseTo(1, 4)
    expect(c).toBeCloseTo(0.1, 4)
    expect(r2).toBeCloseTo(1, 4)
  })
})

describe("buildRegressionBand", () => {
  it("la banda siempre contiene la línea de regresión (lower <= reg <= upper)", () => {
    const data: DataPoint[] = [
      { p: 5000, q: 178 }, { p: 5500, q: 167 }, { p: 6000, q: 154 },
      { p: 6500, q: 142 }, { p: 7000, q: 130 }, { p: 7500, q: 118 },
    ]
    const reg = linearRegression(data)
    const band = buildRegressionBand(data, reg)
    for (const pt of band) {
      expect(pt.q_lower).toBeLessThanOrEqual(pt.q_reg + 1e-9)
      expect(pt.q_upper).toBeGreaterThanOrEqual(pt.q_reg - 1e-9)
    }
  })

  it("q_lower nunca es negativo (no tiene sentido vender unidades negativas)", () => {
    const data: DataPoint[] = [
      { p: 5000, q: 178 }, { p: 5500, q: 167 }, { p: 6000, q: 154 }, { p: 6500, q: 5 },
    ]
    const reg = linearRegression(data)
    const band = buildRegressionBand(data, reg)
    for (const pt of band) {
      expect(pt.q_lower).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("buildCurves", () => {
  it("bp siempre es igual a ip - cp", () => {
    const curves = buildCurves(100, 2, 10, 5, 1, 40, 20)
    for (const pt of curves) {
      expect(pt.bp).toBeCloseTo(pt.ip - pt.cp, 6)
    }
  })

  it("ep se mantiene acotado y finito incluso cerca del precio de saturación (Q→0)", () => {
    // a/b = 50 es el precio de saturación; se muestrea justo hasta el borde
    const curves = buildCurves(100, 2, 10, 5, 1, 49.999, 50)
    for (const pt of curves) {
      expect(Number.isFinite(pt.ep)).toBe(true)
      expect(pt.ep).toBeGreaterThanOrEqual(-50)
      expect(pt.ep).toBeLessThanOrEqual(0)
    }
  })
})
