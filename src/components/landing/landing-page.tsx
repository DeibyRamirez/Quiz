"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { BloqueIa } from "@/components/landing/bloque-ia";
import { ComoFunciona } from "@/components/landing/como-funciona";
import { DemoTablero } from "@/components/landing/demo-tablero";
import { FooterWordmark } from "@/components/landing/footer-wordmark";
import { HeroPin } from "@/components/landing/hero-pin";
import { Marquesina } from "@/components/landing/marquesina";
import { Sello } from "@/components/quiz/sello";

const LandingMotion = dynamic(
  () => import("@/components/landing/landing-motion").then((mod) => mod.LandingMotion),
  { ssr: false }
);

export function LandingPage() {
  return (
    <div className="page-shell" style={{ background: "var(--qq-bg)" }}>
      <LandingMotion />
      <header className="qq-wrap flex items-center justify-between gap-3 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8" aria-hidden>
            <Image src="/Icono.png" alt="" fill className="object-contain" sizes="32px" priority />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-extrabold">QuimeQuiz</span>
        </Link>
        <div className="hidden md:block">
          <Sello texto="UNIAUTÓNOMA · QUIZ EN VIVO" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="qq-btn-plain">Soy docente</Link>
          <Link href="/login" className="btn-primary px-4">Ingresar</Link>
        </div>
      </header>

      <section className="qq-hero qq-wrap">
        <div className="qq-grid mt-auto items-end">
          <div className="col-span-12 lg:col-span-8">
            <p className="qq-label mb-4">Fuerzas eléctricas · Uniautónoma del Cauca</p>
            <h1 className="qq-hero-title" data-hero-title>
              <span className="qq-line-mask" data-hero-line>Aprende</span>
              <span className="qq-line-mask" data-hero-line>
                <span className="qq-mark">jugando.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-[length:var(--t-body)] leading-snug">
              El quiz en vivo de la clase. Entras con el PIN y compites desde el celular.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <HeroPin />
          </div>
        </div>
      </section>

      <Marquesina />
      <ComoFunciona />
      <DemoTablero />
      <BloqueIa />

      <section className="qq-section">
        <div className="qq-wrap">
          <p className="qq-display">
            1000 pts por pregunta · 6 tipos · tiempo real
          </p>
        </div>
      </section>
      <FooterWordmark />
    </div>
  );
}
