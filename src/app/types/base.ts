/** Campos de auditoría que Mongoose agrega con `timestamps: true` */
export interface Timestamps {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/** Campos comunes de entidades persistidas en MongoDB */
export interface EntidadBase {
  id: string;
  creadoEn: Date | string;
}

export type OmitEntidadPersistida<T extends EntidadBase> = Omit<
  T,
  "id" | "creadoEn" | "createdAt" | "updatedAt"
>;
