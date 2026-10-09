import ProtectedRoute from "@/components/ProtectedRoute";
import { RolUsuario } from "@/app/types";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      allowedRoles={[RolUsuario.DOCENTE, RolUsuario.ADMINISTRADOR]}
    >
      {children}
    </ProtectedRoute>
  );
}
