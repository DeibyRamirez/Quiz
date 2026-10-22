"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinOtp } from "@/components/quiz/pin-otp";

export function HeroPin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const entrar = () => {
    if (!/^\d{6}$/.test(pin)) {
      setError("El PIN tiene 6 dígitos.");
      return;
    }
    try {
      sessionStorage.setItem("qq_pin", pin);
    } catch {
      /* ignore */
    }
    router.push(`/login?pin=${pin}`);
  };

  return (
    <div className="qq-card-brutal p-5 sm:p-6">
      <p className="qq-label">Únete con PIN</p>
      <p className="mt-2 text-base">El mismo número que proyecta tu docente.</p>
      <div className="mt-4">
        <PinOtp id="pin-portada" value={pin} onChange={(valor) => { setPin(valor); setError(""); }} onComplete={() => {}} />
      </div>
      {error ? (
        <p className="text-error mt-3" role="alert">{error}</p>
      ) : null}
      <button type="button" className="btn-primary mt-4 w-full" onClick={entrar}>
        Entrar
      </button>
    </div>
  );
}
