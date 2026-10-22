import { NextResponse } from "next/server";
import type { ResultadosQuiz } from "@/app/types/sesion";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { obtenerPayloadSesion } from "@/lib/server/auth/session";
import {
  lectorPuedeVerRespuestas,
  serializarRespuestaParticipante,
} from "@/lib/server/services/visibilidad-pregunta";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const sesiones = await SesionLiveModel.find({ quizId: params.id })
      .select("pin sessionName")
      .lean();

    const payload = await obtenerPayloadSesion();
    const puedeVerClave = await lectorPuedeVerRespuestas(params.id);

    const participantes = await ParticipanteSesionModel.find({
      quizId: params.id,
    }).lean();

    const sessionNameByPin = new Map<string, string>();
    for (const s of sesiones) {
      const name = s.sessionName?.trim() || `Sesión ${s.pin}`;
      sessionNameByPin.set(s.pin, name);
    }

    const groupMap = new Map<
      string,
      { name: string; sessionIds: string[]; playerCount: number }
    >();

    const lista = participantes.map((p) => {
      const sessionName =
        p.sessionName?.trim() ||
        sessionNameByPin.get(p.sesionPin) ||
        `Sesión ${p.sesionPin}`;

      if (!groupMap.has(sessionName)) {
        groupMap.set(sessionName, {
          name: sessionName,
          sessionIds: [],
          playerCount: 0,
        });
      }
      const group = groupMap.get(sessionName)!;
      if (!group.sessionIds.includes(p.sesionPin)) {
        group.sessionIds.push(p.sesionPin);
      }

      return {
        userId: p.userId,
        sessionId: p.sesionPin,
        sessionName,
        playerName: p.playerName,
        totalScore: p.totalScore ?? 0,
        answers:
          puedeVerClave || payload?.sub === p.userId
            ? (p.answers ?? []).map((a: Record<string, unknown>) =>
                serializarRespuestaParticipante(a, { incluirClave: puedeVerClave })
              )
            : [],
      };
    });

    for (const group of groupMap.values()) {
      group.playerCount = lista.filter((a) =>
        group.sessionIds.includes(a.sessionId)
      ).length;
    }

    const sessionGroups = Array.from(groupMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const resultado: ResultadosQuiz = {
      quizId: params.id,
      sessionGroups,
      participantes: lista,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    return manejarErrorApi(error);
  }
}
