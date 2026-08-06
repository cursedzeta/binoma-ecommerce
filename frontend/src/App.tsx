import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CompraResultado from "./pages/CompraResultado";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white text-neutral-800">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/producto/:slug" element={<ProductDetail />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* Las tres back_urls de Mercado Pago: exitosa, fallida, pendiente */}
            <Route path="/compra/:resultado" element={<CompraResultado />} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
