import { useEffect, useState } from "react";
import { getProductBySlug, getProducts } from "../services/api";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// Envuelve una promesa en estado de React e ignora la respuesta si el
// componente se desmonto o si cambio el parametro antes de que resolviera.
function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let vigente = true;
    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((data) => {
        if (vigente) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        const error = err instanceof Error ? err.message : "Error desconocido";
        setState({ data: null, loading: false, error });
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function useProducts(category?: string) {
  return useAsync(() => getProducts(category), [category]);
}

export function useProduct(slug: string) {
  return useAsync(() => getProductBySlug(slug), [slug]);
}
