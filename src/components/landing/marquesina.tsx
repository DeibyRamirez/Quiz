const TEXTO =
  "COULOMB · VECTORES · CAMPO ELÉCTRICO · EN VIVO · CON IA · COULOMB · VECTORES · CAMPO ELÉCTRICO · EN VIVO · CON IA · ";

export function Marquesina() {
  return (
    <div className="qq-marquesina" aria-hidden="true">
      <div className="qq-marquesina-track" data-marquee>
        <span>{TEXTO}</span>
        <span>{TEXTO}</span>
      </div>
    </div>
  );
}
