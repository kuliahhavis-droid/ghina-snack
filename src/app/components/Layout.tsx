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

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: TrendingUp, label: 'Pemasukan', path: '/pemasukan' },
  { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
  { icon: FileText, label: 'Laporan', path: '/laporan' },
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
      ? { label: 'Tambah Pemasukan', path: '/pemasukan?add=1', className: 'from-[#65C466] to-[#1F6B3A]' }
      : location.pathname === '/pengeluaran'
        ? { label: 'Tambah Pengeluaran', path: '/pengeluaran?add=1', className: 'from-[#EF4444] to-[#DC2626]' }
        : null;

  const activeClasses = 'text-white';
  const inactiveClasses = 'text-[#6B7280] hover:bg-[#F0FDF4]/60';
  const showText = isMobile ? true : sidebarOpen;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      <motion.aside
        initial={isMobile ? { x: -288 } : false}
        animate={{
          width: isMobile ? 288 : (sidebarOpen ? 288 : 80),
          x: isMobile && !sidebarOpen ? -288 : 0,
        }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#65C466]/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] h-screen overflow-hidden"
      >
        <div className={`p-6 border-b border-[#65C466]/10 flex items-center ${showText ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3 shrink-0">
            <img src={logoImg} alt="Ghina Snack Logo" className="h-11 w-auto object-contain shrink-0" />
            {showText && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F0FDF4] text-[#1F6B3A] rounded-md border border-[#65C466]/20 shrink-0">Finance</span>
            )}
          </div>
          {isMobile && sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-[#6B7280]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-5 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {showText ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] whitespace-nowrap"
                >
                  {group.title}
                </motion.p>
              ) : (
                <div className="mx-2 my-2 border-t border-[#65C466]/10" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      whileHover={{ x: showText ? 4 : 0 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-full flex items-center ${showText ? 'justify-start gap-3 px-4' : 'justify-center px-0'} py-2.5 min-h-11 rounded-xl transition-all duration-200 z-10 ${
                        isActive ? activeClasses : inactiveClasses
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-[#65C466] to-[#1F6B3A] rounded-xl -z-10 shadow-[0_4px_12px_rgba(31,107,58,0.15)]"
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                      {showText && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-medium text-sm transition-colors duration-200 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#65C466]/10">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center ${showText ? 'justify-start gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {showText && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium whitespace-nowrap"
              >
                Keluar
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.aside>

      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          isMobile
            ? 'pl-0'
            : sidebarOpen
              ? 'md:pl-72'
              : 'md:pl-20'
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#65C466]/10 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setSidebarOpen((current) => !current)}
              whileHover={{ scale: 1.05, boxShadow: '0 0 0 8px rgba(101, 196, 102, 0.12)' }}
              whileTap={{ scale: 0.95 }}
              className="p-2 min-h-11 min-w-11 hover:bg-[#F0FDF4] rounded-xl transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-[#1F6B3A]" />
              ) : (
                <Menu className="w-6 h-6 text-[#1F6B3A]" />
              )}
            </motion.button>
            {isMobile && (
              <div className="flex items-center gap-2 ml-1">
                <img src={logoImg} alt="Ghina Snack Logo" className="h-8 w-auto object-contain" />
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#F0FDF4] text-[#1F6B3A] rounded border border-[#65C466]/20">Finance</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#1F2937]">{user?.name ?? 'User'}</p>
              <p className="text-xs text-[#6B7280]">{user?.role ?? 'STAFF'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#65C466] to-[#1F6B3A] shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.24, 0.6, 0.4, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {isMobile && addAction && (
          <motion.button
            type="button"
            onClick={() => navigate(addAction.path)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`fixed bottom-24 right-4 z-40 flex min-h-14 items-center gap-2 rounded-full bg-gradient-to-r px-5 py-3 text-white shadow-[0_18px_45px_rgba(31,107,58,0.28)] transition-all ${addAction.className}`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">{addAction.label}</span>
          </motion.button>
        )}

        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#65C466]/10 bg-white/95 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="grid grid-cols-5 gap-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    whileTap={{ scale: 0.94 }}
                    className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors duration-200 z-10 ${
                      isActive ? 'text-[#1F6B3A]' : 'text-[#6B7280]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="absolute inset-0 bg-[#F0FDF4] rounded-2xl -z-10"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-[#1F6B3A]' : 'text-[#94A3B8]'}`} />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
