"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/client/auth";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        const usuario = await obtenerUsuarioActual();

        if (!active) return;

        if (!usuario) {
          setAuthorized(false);
          setLoading(false);
          router.replace("/login");
          return;
        }

        if (allowedRoles.includes(usuario.rol)) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        setAuthorized(false);
        setLoading(false);
        router.replace("/acceso-denegado");
      } catch {
        if (!active) return;
        setAuthorized(false);
        setLoading(false);
        router.replace("/login");
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, [router, allowedRoles]);

  if (loading) return <p className="text-center py-8">Verificando acceso...</p>;
  if (!authorized) return null;

  return <>{children}</>;
}
