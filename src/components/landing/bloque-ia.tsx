import Link from "next/link";

const TIPOS = [
  "Opción múltiple",
  "Verdadero / falso",
  "Numérica",
  "Texto exacto",
  "Abierta",
  "En vivo",
];

export function BloqueIa() {
  return (
    <section className="qq-section" style={{ background: "var(--qq-night)", color: "var(--qq-bg)" }}>
      <div className="qq-wrap">
        <p className="qq-label" style={{ color: "var(--qq-gold)" }}>Para docentes</p>
        <h2 className="qq-display mt-3" style={{ color: "var(--qq-gold)" }}>
          Sube tu guía. Obtén un quiz.
        </h2>
        <p className="mt-4 max-w-xl text-[length:var(--t-body)]" style={{ color: "var(--qq-bg)" }}>
          La integración con IA ya está en el panel docente. Subes un PDF o DOCX y armas el quiz con tu material.
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          {TIPOS.map((tipo, i) => (
            <li
              key={tipo}
              className="qq-chip"
              style={{
                transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
                background: i % 2 === 0 ? "var(--qq-gold)" : "var(--qq-orange)",
                color: "var(--qq-night)",
              }}
            >
              {tipo}
            </li>
          ))}
        </ul>
        <Link href="/teacher/create/ia" className="qq-btn-plain mt-8" style={{ color: "var(--qq-bg)" }}>
          Ir al panel de IA
        </Link>
      </div>
    </section>
  );
}
