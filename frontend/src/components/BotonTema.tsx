import { useTema } from "../context/ThemeContext";

/**
 * Interruptor de modo claro / oscuro.
 *
 * El icono muestra a dónde vas a ir, no dónde estás: en claro se ve una luna
 * porque al tocarlo se hace de noche. Es la convención más extendida y evita
 * la duda de "¿esto indica el estado o la acción?".
 */
export default function BotonTema({
  sobreHero = false,
  className = "",
}: {
  /** true cuando la barra está apoyada sobre el naranja del hero. */
  sobreHero?: boolean;
  className?: string;
}) {
  const { tema, alternar } = useTema();
  const vaAOscuro = tema === "claro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={vaAOscuro ? "Activar modo oscuro" : "Activar modo claro"}
      title={vaAOscuro ? "Modo oscuro" : "Modo claro"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-pieza transition ${
        sobreHero
          ? "text-sobre-hero hover:bg-sobre-hero/15"
          : "text-tenue hover:bg-superficie-2 hover:text-tinta"
      } ${className}`}
    >
      {vaAOscuro ? <IconoLuna /> : <IconoSol />}
    </button>
  );
}

function IconoLuna() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
