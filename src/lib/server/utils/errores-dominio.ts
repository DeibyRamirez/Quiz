/** Errores de dominio con código HTTP explícito. */
export function esErrorConStatus(
  error: unknown
): error is Error & { status: number } {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}
