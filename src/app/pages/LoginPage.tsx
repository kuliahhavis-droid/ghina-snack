import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../../assets/logo.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0] px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-[#65C466] rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#A3E635] rounded-full blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="surface-card surface-card-hover bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-[#65C466]/20">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <img src={logoImg} alt="Ghina Snack Logo" className="w-56 h-auto object-contain filter drop-shadow-sm rounded-2xl" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1F6B3A] mb-2">Ghina Snack Finance</h1>
            <p className="text-sm sm:text-base text-[#6B7280]">Sistem pembukuan dan laporan keuangan</p>
          </motion.div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#65C466]/30 rounded-xl focus:border-[#65C466] focus:outline-none transition-colors"
                  placeholder="Masukkan email"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#65C466]/30 rounded-xl focus:border-[#65C466] focus:outline-none transition-colors"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </motion.div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ scale: 1.02, boxShadow: '0 18px 36px rgba(31, 107, 58, 0.22)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 min-h-12 bg-gradient-to-r from-[#65C466] to-[#1F6B3A] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {submitting ? 'Memproses...' : 'Masuk'}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center text-sm text-[#6B7280] mt-6"
          >
            © 2024 Ghina Snack Finance
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
