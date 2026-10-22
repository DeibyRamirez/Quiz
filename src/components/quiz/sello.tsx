"use client";

import { useId } from "react";

export function Sello({ texto, className = "" }: { texto: string; className?: string }) {
  const crudo = useId().replace(/:/g, "");
  const repeticion = `${texto} · ${texto} · `;

  return (
    <div className={`qq-sello ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path
            id={crudo}
            d="M50,50 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0"
          />
        </defs>
        <text>
          <textPath href={`#${crudo}`}>{repeticion}</textPath>
        </text>
        <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
