"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PinOtp } from "@/components/quiz/pin-otp";
import { RolUsuario } from "@/app/types";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { unirseSesion, obtenerSesion } from "@/lib/client/services/sesiones";
import type { SesionLive } from "@/app/types/sesion";

function StudentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<Awaited<ReturnType<typeof obtenerUsuarioActual>>>(null);
  const [sesionPendiente, setSesionPendiente] = useState<SesionLive | null>(null);
  const autoUnido = useRef(false);
  const enviando = useRef(false);

  useEffect(() => {
    obtenerUsuarioActual().then(setUsuario);
  }, []);

  useEffect(() => {
    if (!usuario) return;

    let savedPin: string | null = null;
    try {
      savedPin = localStorage.getItem("eq_sesion_pin");
    } catch {
      /* ignore */
    }

    if (!savedPin || !/^\d{6}$/.test(savedPin)) return;

    obtenerSesion(savedPin)
      .then((sesion) => {
        if (sesion.status === "lobby" || sesion.status === "active") {
          setSesionPendiente(sesion);
          setPin(savedPin!);
        } else {
          try {
            localStorage.removeItem("eq_sesion_pin");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        try {
          localStorage.removeItem("eq_sesion_pin");
        } catch {
          /* ignore */
        }
      });
  }, [usuario]);

  const handleJoinQuiz = async (pinOverride?: string) => {
    if (enviando.current) return;
    enviando.current = true;
    const pinToUse = pinOverride ?? pin;
    setLoading(true);
    setError("");

    try {
      if (!pinToUse || pinToUse.length !== 6) {
        setError("El PIN debe tener 6 dígitos.");
        return;
      }

      const perfil = usuario ?? await obtenerUsuarioActual();
      if (!perfil) {
        setError("Debes iniciar sesión.");
        router.push("/login");
        return;
      }

      if (perfil.rol !== RolUsuario.ESTUDIANTE) {
        setError("Solo los estudiantes pueden unirse a un quiz con PIN.");
        return;
      }

      const session = await unirseSesion(pinToUse);
      try {
        localStorage.setItem("eq_sesion_pin", pinToUse);
      } catch {
        /* ignore */
      }

      if (session.status === "active") {
        router.push(`/student/quiz/${pinToUse}/play`);
      } else if (session.status === "ended") {
        router.push(`/student/quiz/${pinToUse}/podio`);
      } else {
        router.push(`/student/quiz/${pinToUse}`);
      }
    } catch (e) {
      console.error("Error al unirse:", e);
      setError(
        e instanceof Error ? e.message : "Error al unirse al quiz. Verifica el PIN o intenta de nuevo."
      );
    } finally {
      enviando.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!usuario || usuario.rol !== RolUsuario.ESTUDIANTE || autoUnido.current) return;
    const desdeUrl = searchParams.get("pin") ?? "";
    let guardado = "";
    try {
      guardado = sessionStorage.getItem("qq_pin") ?? "";
    } catch {
      /* ignore */
    }
    const candidato = /^\d{6}$/.test(desdeUrl)
      ? desdeUrl
      : /^\d{6}$/.test(guardado)
        ? guardado
        : "";
    if (!candidato) return;
    autoUnido.current = true;
    try {
      sessionStorage.removeItem("qq_pin");
    } catch {
      /* ignore */
    }
    setPin(candidato);
    void handleJoinQuiz(candidato);
  }, [usuario, searchParams, handleJoinQuiz]);

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main">
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="heading-primary mb-4">Panel del Estudiante</h1>
          <p className="body-text text-muted-foreground max-w-2xl mx-auto px-1">
            Únete a quizzes interactivos y pon a prueba tus conocimientos 
          </p>
        </div>

        <div className="flex items-center justify-center py-0">
          <Card className="card-institutional w-full max-w-2xl p-5 sm:p-8">
            <CardHeader>
              <CardTitle className="heading-secondary text-center">Unirse a un Quiz</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 mt-0">
              {sesionPendiente && (
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl space-y-3">
                  <p className="font-semibold text-foreground">
                    {sesionPendiente.status === "active"
                      ? "Tienes un quiz en curso"
                      : "Tienes un quiz en espera"}
                  </p>
                  <p className="body-small text-muted-foreground">
                    PIN {sesionPendiente.pin}
                    {sesionPendiente.sessionName
                      ? ` · ${sesionPendiente.sessionName}`
                      : ""}
                  </p>
                  <Button
                    onClick={() => handleJoinQuiz(sesionPendiente.pin)}
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "Reconectando..." : "Reconectar al quiz"}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="pin" className="text-lg">Ingrese el PIN del Quiz:</Label>
                <PinOtp
                  id="pin"
                  value={pin}
                  disabled={loading}
                  onChange={setPin}
                  onComplete={(valor) => {
                    if (!loading) void handleJoinQuiz(valor);
                  }}
                />
              </div>

              <Button
                onClick={() => handleJoinQuiz()}
                disabled={loading}
                className="btn-primary w-full text-base sm:text-lg min-h-11 font-semibold"
              >
                {loading ? "Uniendo..." : "Unirse al Quiz"}
              </Button>

              {error ? (
                <p className="text-error mt-2 text-center font-medium" role="alert">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function StudentPage() {
  return (
    <ProtectedRoute allowedRoles={[RolUsuario.ESTUDIANTE]}>
      <StudentPageContent />
    </ProtectedRoute>
  );
}
