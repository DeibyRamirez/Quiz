"use client"

import { useEffect, useState } from "react"

type ConsentValue = "accepted" | "rejected"
const KEY = "eq_cookie_consent_v1"

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const saved = typeof window !== "undefined" ? (localStorage.getItem(KEY) as ConsentValue | null) : null
        if (!saved) setVisible(true)
    }, [])

    const save = (value: ConsentValue) => {
        localStorage.setItem(KEY, value)
        window.dispatchEvent(new Event("eq-consent-changed"))
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    Usamos cookies para operar la plataforma y, si aceptas, para medición y anuncios. Puedes leer más en{" "}
                    <a className="underline" href="/politica-privacidad">
                        Política de Privacidad
                    </a>
                    .
                </p>

                <div className="flex gap-2">
                    <button
                        className="rounded-md border px-3 py-2 text-sm"
                        onClick={() => save("rejected")}
                    >
                        Rechazar
                    </button>
                    <button
                        className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
                        onClick={() => save("accepted")}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    )
}

export function getStoredConsent(): ConsentValue | null {
    if (typeof window === "undefined") return null
    return (localStorage.getItem(KEY) as ConsentValue | null)
}
