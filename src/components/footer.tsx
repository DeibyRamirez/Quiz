import Link from "next/link"

export default function Footer() {
    return (
        <footer className="border-t mt-16 py-6">
            <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground text-sm space-y-2">
                <p>ElectroQuiz - Plataforma Educativa Universitaria para Fuerzas Eléctricas</p>
                <Link className="underline" href="/politica-privacidad">
                    Política de Privacidad
                </Link>
            </div>
        </footer>
    )
}
