
'use client';

import React from 'react';

interface MinimapaKanbanProps {
  totalColumnas?: number;
  scrollRatio: number;
  viewportRatio: number;
  onSelectColumna: (index: number) => void;
}

export default function MinimapaKanban({
  totalColumnas = 5,
  scrollRatio,
  viewportRatio,
  onSelectColumna,
}: MinimapaKanbanProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-lg shadow-sm">
      <span className="text-[11px] font-semibold text-slate-400">Vista:</span>
      <div className="relative flex gap-1 h-5 px-1 py-0.5 bg-slate-950 rounded border border-slate-800 cursor-pointer">
        {Array.from({ length: totalColumnas }).map((_, idx) => (
          <div
            key={idx}
            onClick={() => onSelectColumna(idx)}
            className="w-2.5 h-full bg-slate-800 rounded-sm hover:bg-slate-700 transition-colors"
          />
        ))}

        {/* Recuadro Azul Jira */}
        <div
          className="absolute top-0.5 bottom-0.5 border-2 border-blue-500 bg-blue-500/20 rounded pointer-events-none transition-all duration-75"
          style={{
            width: `${Math.max(viewportRatio * 100, 30)}%`,
            left: `${scrollRatio * (100 - Math.max(viewportRatio * 100, 30))}%`,
          }}
        />
      </div>
    </div>
  );
}