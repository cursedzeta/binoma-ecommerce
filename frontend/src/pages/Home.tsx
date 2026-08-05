import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

const categorias = ["banco", "mesa", "silla"];

export default function Home() {
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const { data: products, loading, error } = useProducts(categoria);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl text-neutral-900">Catálogo</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <FiltroBoton activo={!categoria} onClick={() => setCategoria(undefined)}>
          Todos
        </FiltroBoton>
        {categorias.map((c) => (
          <FiltroBoton
            key={c}
            activo={categoria === c}
            onClick={() => setCategoria(c)}
          >
            {c}
          </FiltroBoton>
        ))}
      </div>

      <div className="mt-8">
        {loading && <p className="text-neutral-500">Cargando productos...</p>}

        {error && (
          <p className="border border-neutral-400 p-4 text-neutral-700">
            No se pudieron cargar los productos: {error}
          </p>
        )}

        {products && products.length === 0 && (
          <p className="text-neutral-500">No hay productos en esta categoría.</p>
        )}

        {products && products.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FiltroBoton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-3 py-1 text-sm capitalize ${
        activo
          ? "border-neutral-900 text-neutral-900"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}
