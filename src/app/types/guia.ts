import type { EntidadBase, OmitEntidadPersistida } from "./base";

export interface GuiaBase extends EntidadBase {
  docenteId: string;
  cursoId?: string;
  titulo: string;
  hashArchivo: string;
  contenidoMarkdown: string;
  estimacionTokens: number;
  creadoEn: Date;
}

export type Guia = GuiaBase;

export type CrearGuia = OmitEntidadPersistida<GuiaBase>;

export interface ResultadoSubidaGuia {
  guiaId: string;
  titulo: string;
  estimacionTokens: number;
  enCache: boolean;
}
