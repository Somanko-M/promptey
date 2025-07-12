// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/index";
import PromptBuilder from "./pages/PromptBuilder";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import PaymentSuccess from "./pages/payment-success";
import { AuthProvider } from "./context/AuthContext";

// ✅ Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prompt-builder" element={<PromptBuilder />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
          </Routes>

          {/* ✅ Toast notifications appear globally */}
          <ToastContainer position="top-center" autoClose={5000} />
        </>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
