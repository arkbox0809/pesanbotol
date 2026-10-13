import React from 'react';

export default function RiverBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1e293b] pointer-events-none">
      {/* Lapisan Air Belakang (Lambat) */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] animate-river-slow" />
      
      {/* Lapisan Gradasi Air Sungai */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0369a1] to-[#0c4a6e] opacity-90" />
      
      {/* Efek Garis Arus Halus */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-wave" />
    </div>
  )
}