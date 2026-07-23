import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PemasukanPage from './pages/PemasukanPage';
import PengeluaranPage from './pages/PengeluaranPage';
import LaporanPage from './pages/LaporanPage';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';

function AnimatedRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';
  const animKey = isAuthPage ? 'auth' : 'app';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animKey}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pemasukan" element={<PemasukanPage />} />
            <Route path="/pengeluaran" element={<PengeluaranPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}