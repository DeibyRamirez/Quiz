import { Types } from "mongoose";

type DocumentoMongo = {
  _id: Types.ObjectId;
  __v?: number;
  contraseña?: string;
  [key: string]: unknown;
};

export function serializarDocumento<T extends Record<string, unknown>>(
  doc: DocumentoMongo,
  opciones?: { incluirContraseña?: boolean }
): T & { id: string } {
  const { _id, __v, contraseña, ...resto } = doc;

  const resultado = {
    ...resto,
    id: _id.toString(),
  } as T & { id: string };

  if (opciones?.incluirContraseña && contraseña !== undefined) {
    (resultado as Record<string, unknown>).contraseña = contraseña;
  }

  return resultado;
}

export function serializarDocumentos<T extends Record<string, unknown>>(
  docs: DocumentoMongo[],
  opciones?: { incluirContraseña?: boolean }
): (T & { id: string })[] {
  return docs.map((doc) => serializarDocumento<T>(doc, opciones));
}
