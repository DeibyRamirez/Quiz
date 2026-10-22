"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mt-16 border-t py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
        <p>QuimeQuiz - Plataforma Educativa Universitaria</p>
      </div>
    </footer>
  );
}
