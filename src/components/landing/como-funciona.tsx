const PASOS = [
  { num: "01", titulo: "El docente crea", texto: "Arma el quiz a mano o desde una guía." },
  { num: "02", titulo: "Tú entras con PIN", texto: "Seis dígitos y ya estás en la sala." },
  { num: "03", titulo: "Compites en vivo", texto: "Respondes, sumas puntos y ves el podio." },
];

export function ComoFunciona() {
  return (
    <section className="qq-section" id="como-funciona" data-reveal-root>
      <div className="qq-wrap">
        <p className="qq-label" data-reveal>Cómo funciona</p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {PASOS.map((paso) => (
            <article key={paso.num}>
              <p className="qq-step-num" data-step-num>{paso.num}</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold" data-reveal>
                {paso.titulo}
              </h2>
              <p className="mt-2 max-w-xs text-[length:var(--t-body)] leading-relaxed" data-reveal>
                {paso.texto}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
