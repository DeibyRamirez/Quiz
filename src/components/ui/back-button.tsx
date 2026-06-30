"use client"

import React from "react"
import Link from "next/link"
import { ArrowBigLeft } from "lucide-react"

interface BackButtonProps {
    fallbackHref?: string
    label?: string
}

export default function BackButton({
    fallbackHref = "/",
    label = "Volver atrás",
}: BackButtonProps) {
    const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()

        // Si existe historial, vuelve a la página anterior
        if (window.history.length > 1) {
            window.history.back()
        } else {
            // Si no hay historial (ej: abrió en pestaña nueva)
            window.location.href = fallbackHref
        }
    }

    return (
        <p className="text-md text-center text-muted-foreground">
            <Link
                href={fallbackHref}
                onClick={handleBack}
                className="flex items-center justify-center underline"
            >
                <span className="mr-2 flex items-center">
                    <ArrowBigLeft size={20} />
                </span>
                {label}
            </Link>
        </p>
    )
}
