"use client"
import { create } from "zustand"
import { DataPoint, RegressionResult, OptimumResult, linearRegression, calcOptimum } from "./math"

interface AppState {
  data: DataPoint[]
  cf: number
  cv: number
  reg: RegressionResult | null
  opt: OptimumResult | null
  setData: (data: DataPoint[]) => void
  setCosts: (cf: number, cv: number) => void
  recalc: () => void
}

export const useStore = create<AppState>((set, get) => ({
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
  opt: null,

  setData: (data) => {
    set({ data })
    get().recalc()
  },

  setCosts: (cf, cv) => {
    set({ cf, cv })
    get().recalc()
  },

  recalc: () => {
    const { data, cf, cv } = get()
    if (data.length < 3) return
    const reg = linearRegression(data)
    const opt = calcOptimum(reg.a, reg.b, cf, cv)
    set({ reg, opt })
  },
}))
