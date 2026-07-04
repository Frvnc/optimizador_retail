"use client"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
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

const DEFAULT_PRODUCT_NAME = "Café de Especialidad 250g"
const DEFAULT_DATA: DataPoint[] = [
  { p: 5000, q: 178 },
  { p: 5500, q: 167 },
  { p: 6000, q: 154 },
  { p: 6500, q: 142 },
  { p: 7000, q: 130 },
  { p: 7500, q: 118 },
  { p: 8000, q: 106 },
  { p: 8500, q: 93 },
]
const DEFAULT_CF = 120000
const DEFAULT_CV = 2800

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
  resetAll: () => void
  recalc: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      productName: DEFAULT_PRODUCT_NAME,
      data: DEFAULT_DATA,
      cf: DEFAULT_CF,
      cv: DEFAULT_CV,
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

      // Deja todo en blanco (a diferencia del estado inicial de la app, que trae el ejemplo del Café
      // precargado). El ejemplo se puede volver a cargar aparte con el botón "Datos de ejemplo".
      // Las filas se dejan vacías (no se eliminan) para que quede una tabla lista para llenar.
      resetAll: () => {
        set({
          productName: "",
          data: [{ p: 0, q: 0 }, { p: 0, q: 0 }, { p: 0, q: 0 }],
          cf: DEFAULT_CF,
          cv: DEFAULT_CV,
          scenarios: [],
          reg: null,
          regQuad: null,
          opt: null,
        })
      },

      recalc: () => {
        const { data, cf, cv } = get()
        if (data.length < 3) return
        const reg = linearRegression(data)
        const opt = calcOptimum(reg.a, reg.b, cf, cv)
        const regQuad = data.length >= 4 ? quadraticRegression(data) : null
        set({ reg, opt, regQuad })
      },
    }),
    {
      name: "optimizador-retail",
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos los datos que el usuario ingresó — reg/opt/regQuad se recalculan al cargar.
      partialize: (state) => ({
        productName: state.productName,
        data: state.data,
        cf: state.cf,
        cv: state.cv,
        scenarios: state.scenarios,
      }),
      onRehydrateStorage: () => (state) => {
        state?.recalc()
      },
    }
  )
)
