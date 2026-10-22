import Link from "next/link";

export function FooterWordmark() {
  return (
    <footer className="qq-wrap pb-6 pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-[var(--qq-hairline)] pt-8">
        <div>
          <p className="font-bold">QuimeQuiz · Uniautónoma del Cauca</p>
          <p className="mt-1 text-base">Fuerzas eléctricas, en vivo.</p>
        </div>
        <nav className="flex gap-4 text-base font-semibold">
          <Link href="/login" className="underline-offset-4 hover:underline">Ingresar</Link>
          <Link href="/politica-privacidad" className="underline-offset-4 hover:underline">Privacidad</Link>
        </nav>
      </div>
      <p className="qq-wordmark mt-6" aria-hidden="true">QUIMEQUIZ</p>
    </footer>
  );
}
