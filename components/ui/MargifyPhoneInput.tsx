"use client";

import { PhoneInput } from "react-international-phone";
import { cn } from "@/lib/utils";
import "react-international-phone/style.css";

type MargifyPhoneInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (e164: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Teléfono internacional: selector de país, prefijo y número (E.164 al guardar). */
export function MargifyPhoneInput({
  id = "phone",
  name = "phone",
  value,
  onChange,
  disabled,
  className,
}: MargifyPhoneInputProps) {
  return (
    <div className={cn("margify-intl-phone w-full", className)}>
      <PhoneInput
        defaultCountry="uy"
        value={value}
        onChange={(phone) => onChange(phone ?? "")}
        disabled={disabled}
        placeholder="Ingresá tu número de teléfono"
        preferredCountries={["uy", "ar", "br", "cl", "mx", "es", "us", "co", "pe"]}
        inputProps={{
          id,
          name,
          autoComplete: "tel",
          "aria-label": "Número de teléfono",
        }}
        className="w-full"
        inputClassName="min-w-0"
      />
    </div>
  );
}
