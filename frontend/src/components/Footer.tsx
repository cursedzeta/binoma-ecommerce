import { Contenedor, Etiqueta } from "./ui";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-borde">
      <Contenedor className="flex flex-col gap-8 py-12 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-lg text-tinta">BINOMA</p>
          <p className="mt-1 max-w-xs text-sm text-tenue">
            Muebles de diseño en fenólico. Córdoba, Argentina.
          </p>
        </div>

        <div>
          <Etiqueta>Contacto</Etiqueta>
          <p className="mt-2 text-sm text-tenue">
            Escribinos por Instagram para consultas y encargos a medida.
          </p>
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
