"use client";

import { useEffect, useRef, useState } from "react";

export function ChipPuntaje({ total }: { total: number }) {
  const [mostrado, setMostrado] = useState(total);
  const desde = useRef(total);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMostrado(total);
      desde.current = total;
      return;
    }
    const inicio = desde.current;
    const t0 = performance.now();
    let frame = 0;
    const tick = (ahora: number) => {
      const t = Math.min(1, (ahora - t0) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      setMostrado(Math.round(inicio + (total - inicio) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else desde.current = total;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total]);

  return (
    <span className="qq-chip tabular-nums" aria-label={`Puntaje ${total}`}>
      {mostrado} pts
    </span>
  );
}
