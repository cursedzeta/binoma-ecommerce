import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "../../lib/format";
import {
  ApiError,
  borrarProducto,
  crearProducto,
  editarProducto,
  getCategorias,
  getProductosAdmin,
  type DatosProducto,
  type ProductoAdmin,
} from "../../services/api";

const VACIO: DatosProducto = {
  name: "",
  description: "",
  price: 0,
  category: "",
  images: [],
  stock: 0,
};

export default function AdminProductos() {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // null = formulario cerrado. "nuevo" = alta. Un id = edición.
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<DatosProducto>(VACIO);
  const [erroresForm, setErroresForm] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const [lista, cats] = await Promise.all([getProductosAdmin(), getCategorias()]);
      setProductos(lista);
      setCategorias(cats.map((c) => c.category));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudieron cargar los productos",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function abrirNuevo() {
    setEditando("nuevo");
    setForm(VACIO);
    setErroresForm([]);
    setAviso(null);
  }

  function abrirEdicion(p: ProductoAdmin) {
    setEditando(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      images: p.images,
      stock: p.stock,
    });
    setErroresForm([]);
    setAviso(null);
  }

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErroresForm([]);

    try {
      if (editando === "nuevo") {
        const creado = await crearProducto(form);
        setAviso(`"${creado.name}" creado. Su dirección web es /producto/${creado.slug}`);
      } else if (editando) {
        await editarProducto(editando, form);
        setAviso("Cambios guardados.");
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErroresForm(err.detalles.length > 0 ? err.detalles : [err.message]);
      } else {
        setErroresForm(["No se pudo guardar. Probá de nuevo."]);
      }
    } finally {
      setGuardando(false);
    }
  }

  async function onBorrar(p: ProductoAdmin) {
    if (!confirm(`¿Borrar "${p.name}"? No se puede deshacer.`)) return;

    setAviso(null);

    try {
      await borrarProducto(p.id);
      setAviso(`"${p.name}" borrado.`);
      await cargar();
    } catch (err) {
      setAviso(err instanceof ApiError ? err.message : "No se pudo borrar");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-neutral-600">
          {productos.length} {productos.length === 1 ? "producto" : "productos"} en el
          catálogo
        </p>
        <button
          onClick={abrirNuevo}
          className="border border-neutral-900 px-4 py-2 text-sm text-neutral-900"
        >
          Nuevo producto
        </button>
      </div>

      {aviso && (
        <p role="status" className="mt-6 border border-neutral-400 p-3 text-sm text-neutral-800">
          {aviso}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 border border-neutral-500 p-3 text-sm text-neutral-900">
          {error}
        </p>
      )}

      {editando && (
        <Formulario
          esNuevo={editando === "nuevo"}
          form={form}
          setForm={setForm}
          categorias={categorias}
          errores={erroresForm}
          guardando={guardando}
          onSubmit={onGuardar}
          onCancelar={() => setEditando(null)}
        />
      )}

      {cargando && <p className="mt-8 text-neutral-500">Cargando productos...</p>}

      {!cargando && productos.length > 0 && (
        <ul className="mt-8 divide-y divide-neutral-300 border-y border-neutral-300">
          {productos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-4 py-4">
              <div className="h-16 w-20 shrink-0 overflow-hidden bg-neutral-100">
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="min-w-48 flex-1">
                <p className="text-neutral-900">{p.name}</p>
                <p className="text-sm text-neutral-600">
                  {formatPrice(p.price)} · {p.category} ·{" "}
                  {p.stock === 0 ? (
                    <span className="text-neutral-900">sin stock</span>
                  ) : (
                    `${p.stock} en stock`
                  )}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">/producto/{p.slug}</p>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <button onClick={() => abrirEdicion(p)} className="underline text-neutral-700">
                  Editar
                </button>
                {p._count.orderItems > 0 ? (
                  <span
                    className="text-neutral-400"
                    title="Aparece en pedidos: poné su stock en 0 para sacarlo de la tienda"
                  >
                    En {p._count.orderItems}{" "}
                    {p._count.orderItems === 1 ? "pedido" : "pedidos"}
                  </span>
                ) : (
                  <button onClick={() => onBorrar(p)} className="underline text-neutral-700">
                    Borrar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Formulario({
  esNuevo,
  form,
  setForm,
  categorias,
  errores,
  guardando,
  onSubmit,
  onCancelar,
}: {
  esNuevo: boolean;
  form: DatosProducto;
  setForm: (d: DatosProducto) => void;
  categorias: string[];
  errores: string[];
  guardando: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancelar: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 border border-neutral-400 p-5">
      <h2 className="text-lg text-neutral-900">
        {esNuevo ? "Nuevo producto" : "Editar producto"}
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Campo label="Nombre" className="sm:col-span-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className={entrada}
          />
        </Campo>

        <Campo label="Descripción" className="sm:col-span-2" ayuda="Es el texto de venta que ve el cliente en la ficha del producto.">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={3}
            className={entrada}
          />
        </Campo>

        <Campo label="Precio" ayuda="En pesos enteros, sin puntos ni centavos. 95000 = $95.000">
          <input
            type="number"
            min={1}
            step={1}
            value={form.price || ""}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
            className={entrada}
          />
        </Campo>

        <Campo label="Stock">
          <input
            type="number"
            min={0}
            step={1}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            required
            className={entrada}
          />
        </Campo>

        <Campo label="Categoría" ayuda="Podés elegir una existente o escribir una nueva.">
          <input
            list="categorias-existentes"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            className={entrada}
          />
          <datalist id="categorias-existentes">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>

        <Campo
          label="Imágenes"
          className="sm:col-span-2"
          ayuda="Una dirección por línea. La primera es la que se ve en el catálogo."
        >
          <textarea
            value={form.images.join("\n")}
            onChange={(e) =>
              setForm({
                ...form,
                images: e.target.value
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean),
              })
            }
            rows={3}
            placeholder="https://..."
            className={entrada}
          />
        </Campo>
      </div>

      {errores.length > 0 && (
        <div role="alert" className="mt-5 border border-neutral-500 p-3">
          <p className="text-sm text-neutral-900">No se pudo guardar:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-neutral-700">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="border border-neutral-900 px-5 py-2 text-neutral-900 disabled:border-neutral-300 disabled:text-neutral-400"
        >
          {guardando ? "Guardando..." : esNuevo ? "Crear producto" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm text-neutral-600 underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

const entrada =
  "mt-1 w-full border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none";

function Campo({
  label,
  ayuda,
  className = "",
  children,
}: {
  label: string;
  ayuda?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm text-neutral-700 ${className}`}>
      {label}
      {children}
      {ayuda && <span className="mt-1 block text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}
