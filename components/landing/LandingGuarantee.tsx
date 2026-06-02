import { Shield } from "lucide-react";

export function LandingGuarantee() {
  return (
    <section
      className="relative z-10 py-10 md:py-14"
      aria-labelledby="guarantee-heading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-[700px] rounded-xl border border-[#222222] bg-[#111111] p-6 text-center md:p-8">
          <Shield className="mx-auto h-10 w-10 text-[#64DFDF]" aria-hidden />
          <h2
            id="guarantee-heading"
            className="mt-4 text-xl font-bold text-white md:text-2xl"
          >
            Sin ningún riesgo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 md:text-base">
            Si en 7 días no ves el valor de Margify, te devolvemos el dinero sin preguntas. No
            necesitamos que nos expliques nada.
          </p>
          <span className="mt-5 inline-flex rounded-full border border-[#64DFDF] px-4 py-1.5 text-sm font-medium text-[#64DFDF]">
            Garantía de 7 días
          </span>
        </div>
      </div>
    </section>
  );
}
