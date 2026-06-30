import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { Inter, Montserrat } from "next/font/google"
import "./globals.css"

import Footer from "@/components/footer"
import CookieBanner from "@/components/cookie-banner"
import AdsenseLoader from "@/components/adsense-loader"


// Fuentes 
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  
});

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
});

// Metadatos para SEO y redes sociales
export const metadata: Metadata = {
  title: "ElectroQuiz - Sistema de Fuerzas Eléctricas",
  description: "Plataforma educativa para el aprendizaje de fuerzas eléctricas universitarias",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* Google AdSense - Verificación */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5641264317544814"
          crossOrigin="anonymous"
        ></script>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        
      </head>

      <body className={`${inter.variable} ${montserrat.variable}`}>
        {/* Carga AdSense SOLO si aceptan */}
        <AdsenseLoader />

        {/* ✅ SOLO limitar ancho en móvil */}
        <div className="mx-auto w-full px-4 sm:px-6">
          <Suspense fallback={null}>{children}</Suspense>
          <Footer />
        </div>

        {/* Banner cookies global */}
        <CookieBanner />

        <Analytics />
        <SpeedInsights />
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  )
}
