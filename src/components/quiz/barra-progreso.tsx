interface BarraProgresoProps {
  total: number;
  actual: number;
  resultados: Array<boolean | null>;
}

export function BarraProgreso({ total, actual, resultados }: BarraProgresoProps) {
  const segmentos = Math.max(total, 1);
  return (
    <div className="qq-segmentos" aria-hidden="true">
      {Array.from({ length: segmentos }, (_, i) => {
        const resultado = resultados[i];
        const clase =
          i === actual
            ? "qq-segmento qq-segmento-actual"
            : resultado === true
              ? "qq-segmento qq-segmento-ok"
              : resultado === false
                ? "qq-segmento qq-segmento-hecho"
                : "qq-segmento";
        return <span key={i} className={clase} title={resultado === true ? "Acertada" : undefined} />;
      })}
    </div>
  );
}
