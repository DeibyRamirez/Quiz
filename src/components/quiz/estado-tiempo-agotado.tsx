export function EstadoTiempoAgotado() {
  return (
    <div className="qq-feedback qq-feedback-bad" role="status" aria-live="assertive">
      <p className="qq-label">Tiempo</p>
      <p className="qq-display mt-2" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
        Se acabó el tiempo
      </p>
      <p className="mt-2 text-base font-bold">+0 pts</p>
      <p className="mt-1">No alcanzó a registrarse una respuesta.</p>
      <p className="qq-espera mt-3 text-base font-semibold">Esperando la siguiente</p>
    </div>
  );
}
