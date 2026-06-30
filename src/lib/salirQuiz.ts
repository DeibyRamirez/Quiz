import { salirSesion } from "@/lib/client/services/sesiones";

export async function salirQuiz(pin: string) {
  try {
    await salirSesion(pin);
  } catch (error) {
    console.error("Error al eliminar jugador del quiz:", error);
  }
}
