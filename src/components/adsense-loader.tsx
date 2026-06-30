"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { getStoredConsent } from "./cookie-banner"

type ConsentValue = "accepted" | "rejected"

export default function AdsenseLoader() {
    const [consent, setConsent] = useState<ConsentValue | null>(null)

    useEffect(() => {
        const read = () => setConsent(getStoredConsent())

        read()
        window.addEventListener("eq-consent-changed", read)
        return () => window.removeEventListener("eq-consent-changed", read)
    }, [])

    // Si no ha decidido o rechazó, no cargamos AdSense
    if (consent !== "accepted") return null

    return (
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5641264317544814"
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
