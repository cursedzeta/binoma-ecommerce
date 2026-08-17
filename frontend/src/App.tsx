import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CompraResultado from "./pages/CompraResultado";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminProductos from "./pages/admin/AdminProductos";

// La tienda lleva el navbar con el carrito; el panel no.
function TiendaLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white text-neutral-800">
            <Routes>
              <Route element={<TiendaLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/producto/:slug" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                {/* Las tres back_urls de Mercado Pago: exitosa, fallida, pendiente */}
                <Route path="/compra/:resultado" element={<CompraResultado />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminPedidos />} />
                <Route path="productos" element={<AdminProductos />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
