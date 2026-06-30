import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function respuestaError(
  mensaje: string,
  status = 500,
  detalles?: unknown
) {
  return NextResponse.json(
    { error: mensaje, ...(detalles !== undefined ? { detalles } : {}) },
    { status }
  );
}

export function manejarErrorApi(error: unknown) {
  if (error instanceof ZodError) {
    return respuestaError("Datos inválidos", 400, error.flatten().fieldErrors);
  }

  if (error instanceof Error && error.name === "ValidationError") {
    return respuestaError(error.message, 400);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    return respuestaError("El registro ya existe (duplicado)", 409);
  }

  const mensaje =
    error instanceof Error ? error.message : "Error interno del servidor";

  return respuestaError(mensaje, 500);
}
