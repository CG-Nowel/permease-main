import React from 'react';
import { Outlet } from 'react-router-dom';

export const KioskLayout: React.FC = () => {
  return (
    <div className="kiosk-surface relative h-screen h-[100dvh] max-h-screen w-screen bg-[#07132B] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle institutional radial gradient - clean, no hazy neon glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0E244D_0%,#07132B_70%)] opacity-80" />

      {/* Main Kiosk Content Container: Edge-to-edge flush with zero visible padding */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center p-0 m-0 overflow-hidden w-full h-full">
        <Outlet />
      </main>

      {/* Grounded Institutional Footer */}
      <footer className="relative z-20 shrink-0 h-8 px-6 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 bg-[#030A17]">
        <p className="truncate font-medium">
          PERMEASE Campus Self-Service Terminal • Contactless RFID & Touch Enabled
        </p>
        <p className="hidden sm:block text-slate-400 font-mono text-[10px]">
          AY 2026–2027 • Official Student Permit System
        </p>
      </footer>
    </div>
  );
};
