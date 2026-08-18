import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// Guardamos SOLO el id y la cantidad, nunca el precio.
// El precio se lee de la API al mostrar el carrito y se congela recien al pagar,
// asi nadie puede editar localStorage y comprar una mesa a $1.
export type CartItem = {
  productId: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

// Los componentes no modifican el carrito: mandan una de estas acciones y el
// reducer decide como se traduce. "stock" viaja en la accion porque el reducer
// no conoce los productos, solo el carrito.
type CartAction =
  | { type: "agregar"; productId: string; stock: number }
  | { type: "quitar"; productId: string }
  | { type: "cambiarCantidad"; productId: string; quantity: number; stock: number }
  | { type: "vaciar" }
  | { type: "sincronizar"; idsValidos: Set<string> };

const STORAGE_KEY = "binoma:carrito";

// Deja n entre 0 y el stock disponible.
function acotar(n: number, stock: number) {
  return Math.max(0, Math.min(n, stock));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "agregar": {
      const actual = state.items.find((i) => i.productId === action.productId);

      if (!actual) {
        if (action.stock < 1) return state;
        return { items: [...state.items, { productId: action.productId, quantity: 1 }] };
      }

      const nueva = acotar(actual.quantity + 1, action.stock);
      // Ya estaba en el tope: devolvemos el mismo objeto para no re-renderizar.
      if (nueva === actual.quantity) return state;

      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: nueva } : i,
        ),
      };
    }

    case "cambiarCantidad": {
      const nueva = acotar(action.quantity, action.stock);

      // Bajar a cero equivale a sacarlo del carrito.
      if (nueva === 0) {
        return { items: state.items.filter((i) => i.productId !== action.productId) };
      }

      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: nueva } : i,
        ),
      };
    }

    case "quitar":
      return { items: state.items.filter((i) => i.productId !== action.productId) };

    case "vaciar":
      return { items: [] };

    case "sincronizar": {
      // Saca del carrito lo que ya no existe en el catalogo. Pasa cuando se
      // borra un producto desde el panel mientras alguien lo tenia guardado:
      // sin esto, el contador del navbar cuenta piezas fantasma que despues
      // no aparecen en la lista.
      const vigentes = state.items.filter((i) => action.idsValidos.has(i.productId));

      // Si no cambio nada, devolvemos el MISMO objeto: con uno nuevo, React
      // volveria a renderizar en cada carga del catalogo y el efecto que
      // llama a esto entraria en bucle.
      if (vigentes.length === state.items.length) return state;

      return { items: vigentes };
    }
  }
}

// Lee el carrito guardado. Corre una sola vez, al montar el provider.
// Si el JSON esta corrupto o alguien lo edito a mano, arrancamos vacio en vez
// de romper toda la aplicacion.
function estadoInicial(): CartState {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return { items: [] };

    const parsed = JSON.parse(guardado);
    if (!Array.isArray(parsed)) return { items: [] };

    const items = parsed.filter(
      (i): i is CartItem =>
        typeof i?.productId === "string" &&
        typeof i?.quantity === "number" &&
        i.quantity > 0,
    );

    return { items };
  } catch {
    return { items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  /** Suma de todas las cantidades, para el contador del navbar. */
  totalItems: number;
  addItem: (productId: string, stock: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number, stock: number) => void;
  clear: () => void;
  /** Descarta del carrito los productos que ya no estan en el catalogo. */
  sincronizarConCatalogo: (idsValidos: string[]) => void;
  quantityOf: (productId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, estadoInicial);

  // Cada vez que cambia el carrito lo persistimos. Un solo lugar de escritura:
  // ninguna accion tiene que acordarse de guardar.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Modo incognito o almacenamiento lleno: el carrito sigue funcionando en
      // memoria, solo que no sobrevive a un refresh.
    }
  }, [state.items]);

  // useMemo evita rehacer este objeto en cada render: sin esto, todo componente
  // que use useCart se redibujaria aunque el carrito no haya cambiado.
  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      totalItems: state.items.reduce((acc, i) => acc + i.quantity, 0),
      addItem: (productId, stock) => dispatch({ type: "agregar", productId, stock }),
      removeItem: (productId) => dispatch({ type: "quitar", productId }),
      setQuantity: (productId, quantity, stock) =>
        dispatch({ type: "cambiarCantidad", productId, quantity, stock }),
      clear: () => dispatch({ type: "vaciar" }),
      sincronizarConCatalogo: (idsValidos) =>
        dispatch({ type: "sincronizar", idsValidos: new Set(idsValidos) }),
      quantityOf: (productId) =>
        state.items.find((i) => i.productId === productId)?.quantity ?? 0,
    }),
    [state.items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  // Pasa si alguien usa useCart fuera del provider. Sin esta guarda el error
  // seria un "cannot read property of null" imposible de rastrear.
  if (!context) {
    throw new Error("useCart tiene que usarse dentro de <CartProvider>");
  }

  return context;
}
