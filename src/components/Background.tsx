function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Background({ accent = "#B8562E" }: { accent?: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7F2E9]"
      style={{ willChange: "transform", transform: "translateZ(0)" }}>
      {/* Difuminado café con leche, muy lento, de fondo */}
      <div className="absolute inset-0 coffee-wash" />
      {/* Rejilla sutil */}
      <div className="absolute inset-0 bg-grid" />
      {/* Grano de papel muy sutil */}
      <div className="absolute inset-0 paper-grain" />
      {/* Halos cálidos — el primero cambia de color según la pestaña activa */}
      <div className="aurora-1 absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-[120px] transition-colors duration-1000"
        style={{ backgroundColor: hexToRgba(accent, 0.1) }} />
      <div className="aurora-2 absolute top-1/3 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#3E6259]/[0.07] blur-[130px]" />
      <div className="aurora-3 absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-[#6F4E37]/[0.09] blur-[140px]" />
      <div className="aurora-4 absolute -bottom-24 -right-20 h-[24rem] w-[24rem] rounded-full bg-[#B8562E]/[0.06] blur-[110px]" />
      {/* Viñeteado leve para enmarcar el contenido */}
      <div className="absolute inset-0 vignette" />
    </div>
  )
}
