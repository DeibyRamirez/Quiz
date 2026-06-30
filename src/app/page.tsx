"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, BookOpen, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [ctaInView, setCtaInView] = useState(true); // al cargar suele estar en view
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // detectar ancho en tiempo real (solo para activar flotante en móvil)
    const check = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!ctaRef.current) return;
    const el = ctaRef.current;

    const io = new IntersectionObserver(
      ([entry]) => {
        setCtaInView(entry.isIntersecting);
      },
      {
        root: null,
        // umbral pequeño para que "salga" rápido del viewport
        threshold: 0.1,
      }
    );

    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  // Botón con estilo llamativo reutilizable
  const FancyButton = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
    <Button
      size="lg"
      className={[
        "relative w-full sm:w-auto",
        "group overflow-hidden",
        "rounded-xl px-6 py-6",
        "font-semibold tracking-wide",
        "shadow-lg hover:shadow-xl",

        // ✅ Estilo Universidad: colores vibrantes y animaciones sutiles
        "bg-secondary hover:bg-primary", // Orange → Navy al hover
        "text-secondary-foreground",      // Texto blanco sobre orange
        "transition-all duration-300",
        "animate-pulse hover:animate-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        className,
      ].join(" ")}
    >
      {/* brillo cruzando */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20
                   transition-transform duration-500 ease-out group-hover:translate-x-0"
      />
      {/* halo al pasar el mouse */}
      <span className="pointer-events-none absolute -inset-1 rounded-2xl bg-white/0 group-hover:bg-white/10 transition" />
      <span className="relative flex items-center">
        <Users className="mr-2 h-5 w-5" />
        {children}
      </span>
    </Button>
  );

  return (
    <div className="page-shell">
      {/* Header */}
      <header className="border-b border-boder bg-primary/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="heading-tertiary">ElectroQuiz</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="quiz-content flex-col items-start!">
        <div className="text-center mb-12 w-full">
          <h2 className="heading-primary text-balance mb-4">
            Aprende Fuerzas Eléctricas de Forma Interactiva
          </h2>
          <p className="body-text text-muted-foreground text-pretty max-w-2xl mx-auto">
            Plataforma educativa universitaria que transforma el aprendizaje de física eléctrica en una experiencia
            dinámica y participativa.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="answers-grid mb-12">
          <Card className="card-institutional text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-primary">Para Docentes</CardTitle>
              <CardDescription>Crea y gestiona quizzes interactivos sobre fuerzas eléctricas</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-institutional text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-secondary mx-auto mb-2" />
              <CardTitle className="text-secondary">Para Estudiantes</CardTitle>
              <CardDescription>Participa en tiempo real y aprende de forma divertida</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-institutional text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-primary">Resultados</CardTitle>
              <CardDescription>Visualiza el progreso y rendimiento en tiempo real</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-institutional text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-secondary mx-auto mb-2" />
              <CardTitle className="text-secondary">Física Eléctrica</CardTitle>
              <CardDescription>Especializado en cálculo de fuerzas eléctricas universitarias</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section (ORIGINAL) */}
        <div ref={ctaRef} className="text-center scroll-mt-24 w-full">
          <Card className=" card-institutional max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="heading-secondary">¿Listo para comenzar?</CardTitle>
              <CardDescription className="body-small">Accede según tu rol y explora la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <FancyButton>Ingresar</FancyButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* CTA FLOTANTE: solo móvil y solo cuando el original NO está visible */}
      {isMobile && !ctaInView && (
        <div
          className={[
            "md:hidden fixed inset-x-4 bottom-4 z-50",
            "transition-all duration-300",
            "animate-in fade-in slide-in-from-bottom-4",
          ].join(" ")}
        >
          <Card className="shadow-2xl border-primary/30 bg-background/95 backdrop-blur supports-back-drop-filter:bg-background/80">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="body-small font-semibold leading-tight">¿Listo para comenzar?</p>
                  <p className="caption text-muted-foreground">Ingresa y únete al quiz</p>
                </div>
                <Link href="/login" className="shrink-0">
                  <FancyButton className="py-4 px-5">Ingresar</FancyButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer
      <footer className="border-t mt-60 py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>ElectroQuiz - Plataforma Educativa Universitaria para Fuerzas Eléctricas</p>
          <Link className="underline" href="/politica-privacidad">
            Política de Privacidad
          </Link>
        </div>
      </footer> */}
    </div>
  );
}
