"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Edit, Trash2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  listarUsuarios,
  actualizarUsuario,
  eliminarUsuario,
} from "@/lib/client/services/usuarios";
import { RolUsuario, type UsuarioPublico } from "@/app/types";
import { toast } from "sonner";

function DashboardAdministradorContent() {
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<RolUsuario | "">("");

  const cargarUsuarios = useCallback(async () => {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      toast.error("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await eliminarUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      toast.success("Usuario eliminado.");
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario.");
    }
  };

  const handleEditar = async (id: string) => {
    if (!newRole) return;
    try {
      await actualizarUsuario(id, { rol: newRole });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol: newRole } : u))
      );
      setEditUser(null);
      setNewRole("");
      toast.success("Rol actualizado.");
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error("Error al actualizar rol.");
    }
  };

  return (
    <div className="page-shell">
      <Navigation />

      <main className="page-main">
        <div className="w-full mb-8">
          <h1 className="heading-primary">Panel del Administrador</h1>
          <p className="body-text text-muted-foreground">
            Administra los usuarios y define sus roles dentro de la plataforma.
          </p>
        </div>

        <Card className="card-institutional w-full">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-primary">Lista de Usuarios</span>
              </div>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Usuarios registrados en la base de datos
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="body-text text-muted-foreground text-center py-8">
                Cargando usuarios...
              </p>
            ) : usuarios.length === 0 ? (
              <p className="body-text text-muted-foreground text-center py-8">
                No hay usuarios registrados aún.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border border-border">
                  <thead className="bg-muted">
                    <tr className="border-b border-border">
                      <th className="p-3 text-foreground font-semibold">Nombre</th>
                      <th className="p-3 text-foreground font-semibold">Correo</th>
                      <th className="p-3 text-center text-foreground font-semibold">Rol</th>
                      <th className="p-3 text-center text-foreground font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-border hover:bg-muted/40"
                      >
                        <td className="p-3 text-foreground">{user.nombre || "—"}</td>
                        <td className="p-3 text-foreground">{user.correo || "—"}</td>
                        <td className="p-3 text-center">
                          {editUser === user.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <Select
                                value={newRole}
                                onValueChange={(v) => setNewRole(v as RolUsuario)}
                              >
                                <SelectTrigger className="w-40 border-border bg-background text-foreground">
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={RolUsuario.ADMINISTRADOR}>
                                    Administrador
                                  </SelectItem>
                                  <SelectItem value={RolUsuario.DOCENTE}>
                                    Docente
                                  </SelectItem>
                                  <SelectItem value={RolUsuario.ESTUDIANTE}>
                                    Estudiante
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleEditar(user.id)}
                                className="bg-secondary text-secondary-foreground hover:bg-primary"
                              >
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.rol === RolUsuario.ADMINISTRADOR
                                  ? "badge-primary"
                                  : user.rol === RolUsuario.DOCENTE
                                    ? "badge-secondary"
                                    : user.rol === RolUsuario.ESTUDIANTE
                                      ? "badge-accent"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {user.rol || "—"}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditUser(user.id);
                                setNewRole(user.rol);
                              }}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminar(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardAdministrador() {
  return (
    <ProtectedRoute allowedRoles={[RolUsuario.ADMINISTRADOR]}>
      <DashboardAdministradorContent />
    </ProtectedRoute>
  );
}
