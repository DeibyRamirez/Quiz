"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { establecerSesionCache } from "@/lib/client/auth";
import { iniciarSesion, redirigirPorRol } from "@/lib/client/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const usuario = await iniciarSesion(correo, contraseña);
      establecerSesionCache(usuario);
      redirigirPorRol(usuario.rol, router);
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "Error al iniciar sesión.";
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src="/logo_universidad.png" alt="Logo" className="w-32 mx-auto mb-6" />
        <h1 className="heading-secondary text-center mb-2">Iniciar sesión</h1>
        <p className="body-small text-muted-foreground mb-6 text-center">
          Accede con tu cuenta de ElectroQuiz
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              placeholder="tu@uniautonoma.edu.co"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoComplete="email"
              className="input-institutional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <Input
              id="contraseña"
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
              autoComplete="current-password"
              className="input-institutional"
            />
          </div>

          <Button type="submit" className="w-full btn-primary" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>

        {error && <p className="text-error mt-4 text-center">{error}</p>}

        <p className="text-center caption mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-primary font-medium hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
