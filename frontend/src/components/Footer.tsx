import { Link } from "react-router-dom";
import { Contenedor, Etiqueta } from "./ui";

const INSTAGRAM = "https://www.instagram.com/binoma.estudio/";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-borde">
      <Contenedor className="flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
        <div>
          <img
            src="/binoma_logo.svg"
            alt="BINOMA"
            width={1073}
            height={225}
            className="h-5 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm text-tenue">
            Muebles de diseño en fenólico. Córdoba, Argentina.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
          <div>
            <Etiqueta>Tienda</Etiqueta>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link to="/catalogo" className="text-tenue transition hover:text-tinta">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/carrito" className="text-tenue transition hover:text-tinta">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <Etiqueta>Seguinos</Etiqueta>
            <a
              href={INSTAGRAM}
              // noopener protege contra que la pestaña nueva manipule esta;
              // noreferrer evita filtrarle a Instagram desde dónde llegaste.
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-pieza border border-borde px-3.5 py-2 text-sm text-tinta transition hover:border-marca hover:text-marca-texto"
            >
              <IconoInstagram />
              @binoma.estudio
            </a>
          </div>
        </div>
      </Contenedor>

      <Contenedor className="border-t border-borde py-5">
        <p className="text-xs text-tenue">
          © {new Date().getFullYear()} BINOMA. Todos los derechos reservados.
        </p>
      </Contenedor>
    </footer>
  );
}

function IconoInstagram() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}
