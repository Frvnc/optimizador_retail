"use client"
import { create } from "zustand"
import {
  DataPoint, RegressionResult, OptimumResult, QuadraticRegressionResult,
  linearRegression, calcOptimum, quadraticRegression,
} from "./math"

export interface Scenario {
  id: number
  label: string
  cf: number
  cv: number
  pStar: number
  bStar: number
  qStar: number
}

interface AppState {
  productName: string
  data: DataPoint[]
  cf: number
  cv: number
  reg: RegressionResult | null
  regQuad: QuadraticRegressionResult | null
  opt: OptimumResult | null
  scenarios: Scenario[]
  setProductName: (name: string) => void
  setData: (data: DataPoint[]) => void
  setCosts: (cf: number, cv: number) => void
  addScenario: (label?: string) => void
  removeScenario: (id: number) => void
  clearScenarios: () => void
  recalc: () => void
}

export const useStore = create<AppState>((set, get) => ({
  productName: "Café de Especialidad 250g",
  data: [
    { p: 5000, q: 178 },
    { p: 5500, q: 167 },
    { p: 6000, q: 154 },
    { p: 6500, q: 142 },
    { p: 7000, q: 130 },
    { p: 7500, q: 118 },
    { p: 8000, q: 106 },
    { p: 8500, q: 93 },
  ],
  cf: 120000,
  cv: 2800,
  reg: null,
  regQuad: null,
  opt: null,
  scenarios: [],

  setProductName: (productName) => set({ productName }),

  setData: (data) => {
    set({ data })
    get().recalc()
  },

  setCosts: (cf, cv) => {
    set({ cf, cv })
    get().recalc()
  },

  addScenario: (label) => {
    const { cf, cv, opt, scenarios } = get()
    if (!opt || !opt.isValid) return
    const id = Date.now()
    set({
      scenarios: [
        ...scenarios,
        {
          id,
          label: label ?? `Escenario ${scenarios.length + 1}`,
          cf,
          cv,
          pStar: opt.pStar,
          bStar: opt.bStar,
          qStar: opt.qStar,
        },
      ],
    })
  },

  removeScenario: (id) =>
    set({ scenarios: get().scenarios.filter((s) => s.id !== id) }),

  clearScenarios: () => set({ scenarios: [] }),

  recalc: () => {
    const { data, cf, cv } = get()
    if (data.length < 3) return
    const reg = linearRegression(data)
    const opt = calcOptimum(reg.a, reg.b, cf, cv)
    const regQuad = data.length >= 4 ? quadraticRegression(data) : null
    set({ reg, opt, regQuad })
  },
}))
