export const DOMINIO_CORREO_INSTITUCIONAL = "uniautonoma.edu.co";

// Validacion de Dominio correo electronico
export function correoEsInstitucional(correo: string): boolean {
  const normalizado = correo.trim().toLowerCase();
  return normalizado.endsWith(`@${DOMINIO_CORREO_INSTITUCIONAL}`);
}
