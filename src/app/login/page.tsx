"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { establecerSesionCache } from "@/lib/client/auth";
import {
  iniciarSesion,
  iniciarSesionConGoogle,
  redirigirPorRol,
} from "@/lib/client/services/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

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

  const handleGoogleLogin = async () => {
    setError("");
    setLoadingGoogle(true);

    try {
      const usuario = await iniciarSesionConGoogle();
      establecerSesionCache(usuario);
      redirigirPorRol(usuario.rol, router);
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "Error al iniciar sesión con Google.";
      setError(mensaje);
    } finally {
      setLoadingGoogle(false);
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
            <PasswordInput
              id="contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
              autoComplete="current-password"
              className="input-institutional"
            />
          </div>

          <Button type="submit" className="w-full btn-primary" disabled={loading || loadingGoogle}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading || loadingGoogle}
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          {loadingGoogle ? "Conectando..." : "Continuar con Google"}
        </Button>

        <p className="text-center caption mt-4 text-muted-foreground">
          Solo cuentas institucionales @uniautonoma.edu.co
        </p>

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
