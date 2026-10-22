"use client";

import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";

interface PinOtpProps {
  id?: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  onComplete?: (valor: string) => void;
}

export function PinOtp({ id, value, onChange, disabled, onComplete }: PinOtpProps) {
  return (
    <OTPInput
      id={id}
      maxLength={6}
      value={value}
      disabled={disabled}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      autoComplete="one-time-code"
      onChange={(nuevo) => onChange(nuevo.replace(/\D/g, "").slice(0, 6))}
      onComplete={onComplete}
      containerClassName="flex justify-center"
      render={({ slots }) => (
        <div className="flex flex-wrap justify-center gap-2">
          {slots.map((slot, indice) => (
            <div
              key={indice}
              className="qq-pin-slot"
              data-active={slot.isActive ? "true" : "false"}
            >
              {slot.char ?? ""}
            </div>
          ))}
        </div>
      )}
      aria-label="PIN de 6 dígitos"
    />
  );
}
