import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Cart from "./pages/Cart";
import Catalogo from "./pages/Catalogo";
import CompraResultado from "./pages/CompraResultado";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminProductos from "./pages/admin/AdminProductos";
import { Analytics } from "@vercel/analytics/react";

// La tienda lleva navbar y pie de página; el panel no.
function TiendaLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<TiendaLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/producto/:slug" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              {/* El checkout dejo de ser una pagina aparte: vive dentro del
                  carrito. La ruta queda redirigiendo por si alguien la tiene
                  guardada o la comparte. */}
              <Route path="/checkout" element={<Navigate to="/carrito" replace />} />
              {/* Las tres back_urls de Mercado Pago: exitosa, fallida, pendiente */}
              <Route path="/compra/:resultado" element={<CompraResultado />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminPedidos />} />
              <Route path="productos" element={<AdminProductos />} />
            </Route>
          </Routes>

          {/* Analytics de Vercel: no dibuja nada, solo cuenta visitas.
              Va acá, hermano de <Routes> y adentro de <BrowserRouter>, por
              dos motivos:

              - Adentro del router, para que registre cada cambio de página.
                En una SPA no hay recarga al navegar, así que sin esto Vercel
                vería una sola visita por sesión sin importar cuántas piezas
                se miren.
              - Hermano y no hijo de una ruta, para que no se desmonte y
                vuelva a montarse en cada navegación.

              Solo reporta desde el dominio de Vercel: en localhost no manda
              nada. Y hay que prenderlo una vez en el panel de Vercel, en la
              pestaña Analytics del proyecto. */}
          <Analytics />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
