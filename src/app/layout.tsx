import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { Bricolage_Grotesque, Inter, Montserrat } from "next/font/google"
import "./globals.css"

import Footer from "@/components/footer"
import AdsenseLoader from "@/components/adsense-loader"
import CookieBanner from "@/components/cookie-banner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
})

export const metadata: Metadata = {
  title: "QuimeQuiz - Sistema de Fuerzas Eléctricas",
  description: "Plataforma educativa para el aprendizaje de fuerzas eléctricas universitarias",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fuentes = `${inter.variable} ${montserrat.variable} ${bricolage.variable} ${GeistMono.variable}`

  return (
    <html lang="es" className={fuentes}>
      <body className={fuentes}>
        <AdsenseLoader />
        <CookieBanner />

        <div className="mx-auto w-full">
          <Suspense fallback={null}>{children}</Suspense>
          <Footer />
        </div>

        <Analytics />
        <SpeedInsights />
        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{ className: "qq-toast" }}
        />
      </body>
    </html>
  )
}
