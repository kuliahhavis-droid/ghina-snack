import { useEffect, useState, type ElementType } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Package,
  Truck,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from './ui/use-mobile';
import logoImg from '../../assets/logo.jpg';

interface NavItem {
  icon: ElementType;
  label: string;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Menu Utama',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Laporan', path: '/laporan' },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      { icon: TrendingUp, label: 'Pemasukan', path: '/pemasukan' },
      { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
    ],
  },
  {
    title: 'Data Master',
    items: [
      { icon: Package, label: 'Produk (Stok)', path: '/products' },
      { icon: Truck, label: 'Supplier', path: '/suppliers' },
      { icon: Users, label: 'Reseller', path: '/customers' },
    ],
  },
  {
    title: 'Akun',
    items: [
      { icon: User, label: 'Profile', path: '/profile' },
    ],
  },
];

// All features list for mobile horizontal scrollable bottom bar
const allMobileNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: TrendingUp, label: 'Pemasukan', path: '/pemasukan' },
  { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
  { icon: FileText, label: 'Laporan', path: '/laporan' },
  { icon: Package, label: 'Stok', path: '/products' },
  { icon: Truck, label: 'Supplier', path: '/suppliers' },
  { icon: Users, label: 'Reseller', path: '/customers' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function Layout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // On mobile, sidebar is closed by default
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const addAction =
    location.pathname === '/pemasukan'
      ? { label: 'Tambah Pemasukan', path: '/pemasukan?add=1', className: 'bg-emerald-600 hover:bg-emerald-700' }
      : location.pathname === '/pengeluaran'
        ? { label: 'Tambah Pengeluaran', path: '/pengeluaran?add=1', className: 'bg-red-600 hover:bg-red-700' }
        : null;

  const showText = isMobile ? true : sidebarOpen;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 font-sans text-slate-900 relative">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      {!isMobile && (
        <motion.aside
          animate={{
            width: sidebarOpen ? 288 : 80,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white h-screen overflow-hidden shadow-xs"
        >
          {/* Logo Section */}
          <div className={`px-6 py-5 border-b border-slate-100 flex items-center ${showText ? 'justify-between' : 'justify-center'}`}>
            <div className="flex items-center gap-3 shrink-0">
              <img src={logoImg} alt="Ghina Snack Logo" className="h-10 w-auto object-contain shrink-0" />
              {showText && (
                <span className="text-xs font-bold text-slate-800 tracking-tight">Ghina Snack</span>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                {showText ? (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </p>
                ) : (
                  <div className="mx-2 my-2 border-t border-slate-100" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`relative w-full flex items-center ${showText ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {showText && (
                          <span className="whitespace-nowrap">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Account / Logout */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${showText ? 'justify-start gap-3 px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all`}
            >
              <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
              {showText && (
                <span className="whitespace-nowrap">Keluar</span>
              )}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-200 w-full max-w-full overflow-x-hidden ${
          isMobile
            ? 'pl-0'
            : sidebarOpen
              ? 'md:pl-72'
              : 'md:pl-20'
        }`}
      >
        {/* Top Header - Fixed on Mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Only Visible on Desktop) */}
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen((current) => !current)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Mobile Clean Header Logo */}
            {isMobile && (
              <div className="flex items-center gap-2.5">
                <img src={logoImg} alt="Ghina Snack Logo" className="h-8 w-auto object-contain" />
                <div>
                  <h1 className="text-sm font-bold text-slate-900 leading-none">Ghina Snack</h1>
                  <span className="text-[10px] text-slate-500 font-medium">Finance App</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name ?? 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() ?? 'staff'}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className={`flex-1 p-4 overflow-x-hidden ${isMobile ? 'pb-28' : 'md:p-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Fixed Floating Add Action Button */}
        {isMobile && addAction && (
          <button
            type="button"
            onClick={() => navigate(addAction.path)}
            className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-xl font-medium text-sm transition-all ${addAction.className}`}
          >
            <Plus className="h-5 w-5" />
            <span>{addAction.label}</span>
          </button>
        )}

        {/* Mobile Fixed Bottom Navigation Bar */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 z-50 w-full border-t border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-0.5 max-w-full touch-pan-x">
              {allMobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
