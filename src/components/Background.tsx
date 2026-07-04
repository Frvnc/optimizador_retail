export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7F2E9]"
      style={{ willChange: "transform", transform: "translateZ(0)" }}>
      {/* Rejilla sutil */}
      <div className="absolute inset-0 bg-grid" />
      {/* Halos cálidos, muy sutiles */}
      <div className="aurora-1 absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#B8562E]/[0.06] blur-[120px]" />
      <div className="aurora-2 absolute top-1/3 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#3E6259]/[0.05] blur-[130px]" />
    </div>
  )
}
