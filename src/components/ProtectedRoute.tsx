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
    const checkAccess = async () => {
      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        router.push("/login");
        return;
      }

      if (allowedRoles.includes(usuario.rol)) {
        setAuthorized(true);
      } else {
        router.push("/acceso-denegado");
      }

      setLoading(false);
    };

    checkAccess();
  }, [router, allowedRoles]);

  if (loading) return <p className="text-center py-8">Verificando acceso...</p>;
  if (!authorized) return null;

  return <>{children}</>;
}
