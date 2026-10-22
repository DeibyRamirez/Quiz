const COLORES = [
  "#F3EDE1",
  "#EDE6D8",
  "#FFFFFF",
  "#2C3E50",
  "#1E3A5F",
  "#0F2338",
  "#E8740E",
  "#C89B14",
];

/** 16 piezas con la paleta de QuimeQuiz. No hace nada si el usuario pide menos movimiento. */
export function lanzarConfeti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  canvas.width = ancho * dpr;
  canvas.height = alto * dpr;
  ctx.scale(dpr, dpr);

  const piezas = Array.from({ length: 16 }, (_, i) => ({
    x: ancho / 2 + (i - 8) * 14,
    y: alto * 0.42,
    vx: (Math.random() - 0.5) * 9,
    vy: -7 - Math.random() * 5,
    r: 4 + Math.random() * 5,
    color: COLORES[i % COLORES.length],
    rot: Math.random() * 6,
  }));

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, ancho, alto);
    for (const pieza of piezas) {
      pieza.vy += 0.28;
      pieza.x += pieza.vx;
      pieza.y += pieza.vy;
      pieza.rot += 0.12;
      ctx.save();
      ctx.translate(pieza.x, pieza.y);
      ctx.rotate(pieza.rot);
      ctx.fillStyle = pieza.color;
      ctx.fillRect(-pieza.r, -pieza.r / 2, pieza.r * 2, pieza.r);
      ctx.restore();
    }
    frame += 1;
    if (frame < 72) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
