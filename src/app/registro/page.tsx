"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RolUsuario } from "@/app/types";
import { establecerSesionCache } from "@/lib/client/auth";
import { registrarUsuario, redirigirPorRol } from "@/lib/client/services/auth";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState<RolUsuario>(RolUsuario.ESTUDIANTE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const usuario = await registrarUsuario({
        nombre,
        correo,
        contraseña,
        rol,
      });
      establecerSesionCache(usuario);
      redirigirPorRol(usuario.rol, router);
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "Error al crear la cuenta.";
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src="/logo_universidad.png" alt="Logo" className="w-32 mx-auto mb-6" />
        <h1 className="heading-secondary text-center mb-2">Crear cuenta</h1>
        <p className="body-small text-muted-foreground mb-6 text-center">
          Regístrate para usar ElectroQuiz
        </p>

        <form onSubmit={handleRegistro} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="input-institutional"
            />
          </div>

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
              minLength={6}
              autoComplete="new-password"
              className="input-institutional"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de cuenta</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as RolUsuario)}>
              <SelectTrigger className="input-institutional">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RolUsuario.ESTUDIANTE}>Estudiante</SelectItem>
                <SelectItem value={RolUsuario.DOCENTE}>Docente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full btn-primary" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Button>
        </form>

        {error && <p className="text-error mt-4 text-center">{error}</p>}

        <p className="text-center caption mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
