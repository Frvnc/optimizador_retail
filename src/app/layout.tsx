import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Optimizador de Precios Dinámicos · Cálculo Diferencial",
  description:
    "Plataforma web que calcula el precio óptimo de un producto retail mediante regresión, " +
    "derivadas y análisis de sensibilidad. Proyecto ABPro — Cálculo Diferencial, INACAP 2026.",
  keywords: [
    "cálculo diferencial", "optimización de precios", "regresión lineal",
    "elasticidad precio-demanda", "ABPro", "INACAP",
  ],
  authors: [{ name: "Francisco Parra" }, { name: "Joaquín Álamos" }, { name: "Guido Zapata" }, { name: "Luis Cortes" }, { name: "Alejandro Jara" }],
  openGraph: {
    title: "Optimizador de Precios Dinámicos",
    description: "Precio óptimo de un producto retail mediante Cálculo Diferencial.",
    type: "website",
    locale: "es_CL",
  },
};

export const viewport = {
  themeColor: "#B8562E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
