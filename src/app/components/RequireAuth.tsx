import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import logoImg from '../../assets/logo.jpg';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#65C466]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // easeOutExpo
            }}
          >
            <img
              src={logoImg}
              alt="Ghina Snack Logo"
              className="w-48 h-auto object-contain filter drop-shadow-md rounded-2xl"
            />
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            {/* Loading Indicator */}
            <div className="relative w-16 h-1 bg-[#65C466]/20 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#65C466] to-[#1F6B3A] w-[50%]"
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: "easeInOut",
                }}
              />
            </div>
            <p className="text-xs font-semibold text-[#1F6B3A] tracking-wider uppercase opacity-75 animate-pulse">
              Menyiapkan Ruang Keuangan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
