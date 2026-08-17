import { Link } from "react-router-dom";
import { Contenedor, Etiqueta } from "./ui";

const INSTAGRAM = "https://www.instagram.com/binoma.estudio/";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-borde">
      <Contenedor className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <img
            src="/binoma_logo.svg"
            alt="BINOMA"
            width={1073}
            height={225}
            className="h-5 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-tenue">
            Muebles de diseño en fenólico. Diseñados y fabricados en Córdoba,
            Argentina.
          </p>
        </div>

        <div>
          <Etiqueta>Tienda</Etiqueta>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            <li>
              <Enlace to="/catalogo">Catálogo</Enlace>
            </li>
            <li>
              <Enlace to="/carrito">Carrito</Enlace>
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
            className="mt-4 inline-flex items-center gap-2.5 rounded-pieza border border-borde px-4 py-2.5 text-sm text-tinta transition hover:border-marca hover:text-marca-texto"
          >
            <IconoInstagram />
            @binoma.estudio
          </a>
          <p className="mt-4 text-sm text-tenue">
            Escribinos por ahí para consultas y encargos a medida.
          </p>
        </div>
      </Contenedor>

      <Contenedor className="flex flex-col gap-4 border-t border-borde py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-tenue">
          © {new Date().getFullYear()} BINOMA. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-tenue">Pagá con</span>
          <span className="rounded-pieza border border-borde px-2.5 py-1 text-xs font-medium text-tenue">
            Mercado Pago
          </span>
          <span className="text-xs text-tenue">Tarjeta, débito y efectivo</span>
        </div>
      </Contenedor>
    </footer>
  );
}

function Enlace({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-tenue transition hover:text-tinta">
      {children}
    </Link>
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
