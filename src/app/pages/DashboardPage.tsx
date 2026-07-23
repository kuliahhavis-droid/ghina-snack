import { useEffect, useState, type ElementType } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Zap,
  ArrowRight,
  TrendingUp as TrendUpIcon,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { currency, formatDateId, formatMonthId } from '../lib/format';

type DashboardStats = {
  totals: { income: number; expense: number; net: number };
  counts: { income: number; expense: number };
  expenseByCategory: Array<{ categoryId: string; categoryName: string; total: number }>;
  recentTransactions: {
    incomes: Array<{ id: string; source: string; description: string | null; amount: string; transactionDate: string }>;
    expenses: Array<{ id: string; title: string; note: string | null; amount: string; transactionDate: string; category: { name: string } }>;
  };
};

type MonthlyReport = {
  daily: Array<{ date: string; income: number; expense: number; net: number }>;
};

type AdvancedStats = {
  monthlyProfitTrend: Array<{ month: string; gross: number; expense: number; net: number }>;
  paretoAnalysis: Array<{ name: string; amount: number; percentage: number; cumulativePercentage: number }>;
  forecasting: { projectedIncome: number; projectedExpense: number; projectedNet: number };
};

const palette = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2.2,
    repeat: Infinity,
    ease: 'linear',
  },
};

const SkeletonBlock = ({ className }: { className: string }) => (
  <motion.div
    aria-hidden
    className={`rounded-xl bg-[linear-gradient(90deg,#EEF2F7_25%,#F8FAFC_37%,#EEF2F7_63%)] bg-[length:200%_100%] ${className}`}
    {...shimmer}
  />
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <SkeletonBlock className="h-10 w-28 rounded-xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#65C466]/10 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-8 w-32" />
            </div>
            <SkeletonBlock className="h-14 w-14 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  delay,
}: {
  title: string;
  value: string;
  icon: ElementType;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 hover:shadow-[0_24px_60px_rgba(31,107,58,0.12)] transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-[#6B7280] mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-[#1F2937]">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-md`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [advStats, setAdvStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResponse, reportResponse, advStatsResponse] = await Promise.all([
        apiRequest<{ success: boolean; data: DashboardStats }>(`/dashboard/stats?month=${currentMonth}`),
        apiRequest<{ success: boolean; data: MonthlyReport }>(`/reports/monthly?month=${currentMonth}`),
        apiRequest<{ success: boolean; data: AdvancedStats }>(`/dashboard/advanced-stats`),
      ]);

      setStats(statsResponse.data);
      setReport(reportResponse.data);
      setAdvStats(advStatsResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">{error}</div>;
  }

  const chartData = (report?.daily ?? []).map((item) => ({
    day: new Intl.DateTimeFormat('id-ID', { day: '2-digit' }).format(new Date(item.date)),
    pemasukan: item.income,
    pengeluaran: item.expense,
    profit: item.net,
  }));

  const categoryData = (stats?.expenseByCategory ?? []).map((item, index) => ({
    name: item.categoryName,
    value: item.total,
    color: palette[index % palette.length],
  }));

  const recentTransactions = [
    ...(stats?.recentTransactions.incomes ?? []).map((item) => ({
      id: `income-${item.id}`,
      type: 'income' as const,
      desc: item.description ?? item.source,
      amount: Number(item.amount),
      date: item.transactionDate,
    })),
    ...(stats?.recentTransactions.expenses ?? []).map((item) => ({
      id: `expense-${item.id}`,
      type: 'expense' as const,
      desc: item.note ?? item.title,
      amount: Number(item.amount),
      date: item.transactionDate,
    })),
  ]
    .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F6B3A] mb-2">Dashboard</h1>
            <p className="text-[#6B7280]">Ringkasan keuangan Ghina Snack Finance</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -1, boxShadow: '0 16px 36px rgba(101, 196, 102, 0.18)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void loadDashboard()}
            className="flex items-center gap-2 rounded-xl border-2 border-[#65C466]/30 bg-white px-4 py-2 text-sm font-medium text-[#1F2937] shadow-sm animate-fade-in"
          >
            <RefreshCw className="h-4 w-4 text-[#1F6B3A]" />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pemasukan"
          value={currency(stats?.totals.income)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-[#65C466] to-[#1F6B3A]"
          delay={0.1}
        />
        <StatCard
          title="Total Pengeluaran"
          value={currency(stats?.totals.expense)}
          icon={TrendingDown}
          gradient="bg-gradient-to-br from-[#EF4444] to-[#DC2626]"
          delay={0.2}
        />
        <StatCard
          title="Profit Bersih"
          value={currency(stats?.totals.net)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-[#A3E635] to-[#65C466]"
          delay={0.3}
        />
        <StatCard
          title="Total Transaksi"
          value={String((stats?.counts.income ?? 0) + (stats?.counts.expense ?? 0))}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]"
          delay={0.4}
        />
      </div>

      {/* Primary Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Tren Harian Bulan Ini</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#65C466" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#65C466" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#6B7280"
                width={72}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}rb`
                      : String(v)
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [currency(value), name]}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
              <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#65C466" fillOpacity={1} fill="url(#colorPemasukan)" />
              <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#EF4444" fillOpacity={1} fill="url(#colorPengeluaran)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Kategori Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#6B7280"
                width={72}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}rb`
                      : String(v)
                }
              />
              <Tooltip
                formatter={(value: number) => [currency(value), 'Total']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ADVANCED FINANCIAL ANALYTICS */}
      {advStats && (
        <div className="space-y-6">
          <div className="border-t border-[#65C466]/10 pt-6">
            <h2 className="text-xl font-bold text-[#1F6B3A] mb-1">Analisis Finansial Lanjutan</h2>
            <p className="text-xs text-[#6B7280]">Grafik komparatif laba kotor vs laba bersih dan Pareto anggaran pengeluaran.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Laba Kotor vs Laba Bersih Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 lg:col-span-2"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[#6B7280] mb-4">Tren Laba Kotor vs Bersih (6 Bulan Terakhir)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={advStats.monthlyProfitTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#6B7280"
                    width={72}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}jt`
                        : v >= 1_000
                          ? `${(v / 1_000).toFixed(0)}rb`
                          : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [currency(value), name]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
                  <Area name="Omset Kotor" type="monotone" dataKey="gross" stroke="#3B82F6" fill="url(#colorGross)" />
                  <Area name="Profit Bersih" type="monotone" dataKey="net" stroke="#10B981" fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Cash Flow Forecasting Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[#1F6B3A] to-[#114022] rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mb-4">
                  <Zap className="h-5 w-5 text-[#A3E635]" />
                </div>
                <h3 className="text-lg font-bold">Proyeksi Bulan Depan</h3>
                <p className="text-xs text-white/75 mt-1 leading-relaxed">Prediksi cash flow untuk bulan berikutnya menggunakan kalkulasi rata-rata tren 3 bulan terakhir.</p>
              </div>

              <div className="my-6 space-y-4">
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-semibold">Estimasi Pemasukan</p>
                  <p className="text-xl font-bold">{currency(advStats.forecasting.projectedIncome)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-semibold">Estimasi Pengeluaran</p>
                  <p className="text-xl font-bold text-red-300">{currency(advStats.forecasting.projectedExpense)}</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[10px] text-white/60 uppercase font-semibold">Estimasi Bersih (Net Cash)</p>
                  <p className="text-2xl font-black text-[#A3E635]">{currency(advStats.forecasting.projectedNet)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#A3E635] font-semibold bg-white/5 py-2 px-3 rounded-xl">
                <span>Rencana Bisnis Stabil</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          </div>

          {/* Pareto Chart Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 lg:col-span-3"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[#6B7280]">Analisis Pareto Pengeluaran (Kontribusi Anggaran)</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Urutan kategori pengeluaran dari terbesar untuk membantu optimasi efisiensi biaya (hukum 80/20).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Horizontal Bar Chart for Pareto */}
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={advStats.paretoAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#94A3B8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}jt`
                            : v >= 1_000
                              ? `${(v / 1_000).toFixed(0)}rb`
                              : String(v)
                        }
                      />
                      <YAxis type="category" dataKey="name" stroke="#6B7280" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [currency(value), 'Total']}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}
                      />
                      <Bar dataKey="amount" fill="#EF4444" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & Pareto Cumulative Statistics */}
                <div className="space-y-3.5">
                  {advStats.paretoAnalysis.slice(0, 4).map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-700">{currency(item.amount)} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#94A3B8] text-right">Kontribusi Kumulatif: {item.cumulativePercentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
      >
        <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Transaksi Terbaru</h3>
        <div className="space-y-3">
          {recentTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F0FDF4] transition-colors border border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">{transaction.desc}</p>
                  <p className="text-sm text-[#6B7280]">{formatDateId(transaction.date)}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'} {currency(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
