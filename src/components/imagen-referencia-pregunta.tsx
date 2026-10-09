type Props = {
  imageUrl: string;
  alt?: string;
};

/** Imagen de referencia en recuadro (play y vista previa docente). */
export function ImagenReferenciaPregunta({
  imageUrl,
  alt = "Referencia de la pregunta",
}: Props) {
  return (
    <div className="quiz-play-imagen-recuadro">
      <img
        src={imageUrl}
        alt={alt}
        className="quiz-play-imagen-recuadro-img"
      />
    </div>
  );
}
