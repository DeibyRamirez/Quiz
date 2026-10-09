"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Users, BookOpen, X, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { salirQuiz } from "@/lib/salirQuiz"
import { RolUsuario, type UsuarioPublico } from "@/app/types"
import { obtenerUsuarioActual, cerrarSesionApp } from "@/lib/client/auth"

const AVATAR_MOBILE = 44
const AVATAR_DESKTOP = 32

export function Navigation({ pin }: { pin?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)
  const [userPanelOpen, setUserPanelOpen] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (pin) await salirQuiz(pin)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (pin) salirQuiz(pin)
    }
  }, [pin, pathname])

  useEffect(() => {
    if (!userPanelOpen) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest?.("#user-panel-anchor")) setUserPanelOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [userPanelOpen])

  useEffect(() => {
    obtenerUsuarioActual()
      .then(setUsuario)
      .finally(() => setLoadingRole(false))
  }, [pathname])

  const handleLogout = async () => {
    if (pin) await salirQuiz(pin)
    await cerrarSesionApp()
    router.push("/login")
  }

  const role = usuario?.rol ?? null

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="relative inline-flex h-7 w-7 shrink-0 md:h-9 md:w-9"
              aria-hidden
            >
              <Image
                src="/Icono.png"
                alt=""
                fill
                className="object-contain object-center"
                sizes="(max-width: 768px) 28px, 36px"
                priority
              />
            </span>
            <span
              className="font-bold text-foreground truncate flex-1 text-base sm:text-lg md:text-2xl leading-tight"
              title="QuimeQuiz"
            >
              QuimeQuiz
            </span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 min-w-0">
            {usuario && loadingRole && (
              <span className="text-sm text-muted-foreground">Cargando...</span>
            )}

            {role === "docente" && (
              <Link href="/teacher">
                <Button
                  variant={pathname.startsWith("/teacher") ? "default" : "ghost"}
                  size="sm"
                  className="shrink-0 min-h-11 px-2 sm:px-3"
                >
                  <Users className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Docente</span>
                </Button>
              </Link>
            )}

            {role === "estudiante" && (
              <Link href="/student">
                <Button
                  variant={pathname.startsWith("/student") ? "default" : "ghost"}
                  size="sm"
                  className="shrink-0 min-h-11 px-2 sm:px-3"
                >
                  <BookOpen className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Estudiante</span>
                </Button>
              </Link>
            )}

            {role === RolUsuario.ADMINISTRADOR && (
              <>
                <Link href="/teacher">
                  <Button
                    variant={pathname.startsWith("/teacher") ? "default" : "ghost"}
                    size="sm"
                    className="shrink-0 min-h-11 px-2 sm:px-3"
                  >
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Docente</span>
                  </Button>
                </Link>
                <Link href="/administrador">
                  <Button
                    variant={pathname.startsWith("/administrador") ? "default" : "ghost"}
                    size="sm"
                    className="shrink-0 min-h-11 px-2 sm:px-3"
                  >
                    <BookOpen className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Administrador</span>
                  </Button>
                </Link>
              </>
            )}

            {usuario && (
              <div id="user-panel-anchor" className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setUserPanelOpen((v) => !v)}
                  className="hidden md:flex items-center gap-2 pl-4 border-l focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm shrink-0 min-h-11"
                  aria-haspopup="dialog"
                  aria-expanded={userPanelOpen}
                  aria-label="Abrir panel de usuario"
                >
                  <span
                    className="flex items-center justify-center rounded-full bg-primary/10 flex-none"
                    style={{ width: AVATAR_DESKTOP, height: AVATAR_DESKTOP }}
                  >
                    <User className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-sm font-medium text-foreground max-w-[10rem] truncate">
                    {usuario.nombre || usuario.correo}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserPanelOpen((v) => !v)}
                  className="md:hidden pl-3 ml-2 border-l focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm shrink-0 min-h-11 min-w-11"
                  aria-haspopup="dialog"
                  aria-expanded={userPanelOpen}
                  aria-label="Abrir panel de usuario"
                >
                  <span
                    className="flex items-center justify-center rounded-full bg-primary/10 flex-none"
                    style={{ width: AVATAR_MOBILE, height: AVATAR_MOBILE }}
                  >
                    <User className="h-6 w-6 text-primary" />
                  </span>
                </button>

                {userPanelOpen && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="absolute right-0 mt-2 w-[92vw] max-w-xs rounded-xl border bg-white shadow-xl p-4 z-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {usuario.nombre || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {usuario.correo}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserPanelOpen(false)}
                        className="p-1 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Cerrar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={handleLogout}
                        className="w-full h-11 rounded-md"
                        variant="secondary"
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
