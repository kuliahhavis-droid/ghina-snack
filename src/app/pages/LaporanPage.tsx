import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { currency, formatMonthId } from '../lib/format';
import { exportCsv, openPrintWindow } from '../lib/export';
import { useIsMobile } from '../components/ui/use-mobile';
import { Skeleton } from '../components/ui/skeleton';

type ReportResponse = {
  period: { start: string; end: string };
  summary: { income: number; expense: number; net: number };
  daily: Array<{ date: string; income: number; expense: number; net: number }>;
};

const LaporanSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-14 w-14 rounded-2xl" />
        </div>
      ))}
    </div>

    {/* Charts & Tables Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2 border-b border-slate-50">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function LaporanPage() {
  const isMobile = useIsMobile();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiRequest<{ success: boolean; data: ReportResponse }>(`/reports/monthly?month=${month}`);
        setReport(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [month]);

  const monthlyData = (report?.daily ?? []).map((item) => ({
    month: new Intl.DateTimeFormat('id-ID', { day: '2-digit' }).format(new Date(item.date)),
    pemasukan: item.income,
    pengeluaran: item.expense,
    profit: item.net,
  }));

  const profitMargin = report && report.summary.income > 0 ? ((report.summary.net / report.summary.income) * 100).toFixed(1) : '0.0';

  const handleExportExcel = () => {
    if (!report) {
      return;
    }

    exportCsv({
      filename: `laporan-${month}.csv`,
      rows: report.daily,
      columns: [
        { key: 'date', label: 'Tanggal' },
        { key: 'income', label: 'Pemasukan', format: (value) => currency(value as number) },
        { key: 'expense', label: 'Pengeluaran', format: (value) => currency(value as number) },
        { key: 'net', label: 'Profit', format: (value) => currency(value as number) },
      ],
    });
  };

  const handleExportPdf = () => {
    if (!report) {
      return;
    }

    openPrintWindow(
      `Laporan-Keuangan-${month}`,
      `
        <div class="report-header">
          <div class="company-info">
            <h1>Ghina Snack Finance</h1>
            <p>Sistem Pembukuan & Laporan Keuangan Usaha</p>
          </div>
          <div class="report-meta">
            <strong>LAPORAN KEUANGAN BULANAN</strong><br />
            Periode: ${formatMonthId(month)}<br />
            Tanggal Cetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}
          </div>
        </div>

        <div class="summary">
          <div class="card">
            <p class="label">Total Pemasukan</p>
            <p class="value">${currency(report.summary.income)}</p>
          </div>
          <div class="card expense">
            <p class="label">Total Pengeluaran</p>
            <p class="value">${currency(report.summary.expense)}</p>
          </div>
          <div class="card net">
            <p class="label">Profit Bersih</p>
            <p class="value" style="color: ${report.summary.net >= 0 ? '#10B981' : '#EF4444'}">
              ${currency(report.summary.net)}
            </p>
          </div>
          <div class="card margin">
            <p class="label">Margin Profit</p>
            <p class="value">${profitMargin}%</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-left">Tanggal</th>
              <th class="text-right">Pemasukan</th>
              <th class="text-right">Pengeluaran</th>
              <th class="text-right">Profit Harian</th>
            </tr>
          </thead>
          <tbody>
            ${report.daily
        .map(
          (row) => `
                  <tr>
                    <td class="text-left">${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(row.date))}</td>
                    <td class="text-right">${row.income > 0 ? currency(row.income) : '-'}</td>
                    <td class="text-right">${row.expense > 0 ? currency(row.expense) : '-'}</td>
                    <td class="text-right" style="color: ${row.net >= 0 ? '#1F2937' : '#EF4444'}">
                      ${row.net !== 0 ? currency(row.net) : '-'}
                    </td>
                  </tr>
                `
        )
        .join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td class="text-left">TOTAL</td>
              <td class="text-right">${currency(report.summary.income)}</td>
              <td class="text-right">${currency(report.summary.expense)}</td>
              <td class="text-right">${currency(report.summary.net)}</td>
            </tr>
          </tfoot>
        </table>
      `
    );
  };

  if (loading) {
    return <LaporanSkeleton />;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#1F6B3A] mb-2">Laporan Keuangan</h1>
          <p className="text-[#6B7280]">Analisis & ringkasan laba rugi usaha</p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full lg:w-auto">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border-2 border-[#65C466]/30 bg-white px-4 py-3 text-sm focus:border-[#65C466] focus:outline-none w-full sm:w-auto"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#1F2937] border-2 border-[#65C466]/30 rounded-xl hover:border-[#65C466] transition-all w-full sm:w-auto flex-1 sm:flex-initial"
          >
            <FileText className="w-5 h-5" />
            Export PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#65C466] to-[#1F6B3A] text-white rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex-1 sm:flex-initial"
          >
            <Download className="w-5 h-5" />
            Export Excel
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[#65C466] to-[#1F6B3A] rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Pemasukan</p>
              <h3 className="text-2xl font-bold">{currency(report?.summary.income)}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-white/80" />
          </div>
          <p className="text-sm text-white/80">Periode: {formatMonthId(month)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold">{currency(report?.summary.expense)}</h3>
            </div>
            <PieChartIcon className="w-8 h-8 text-white/80" />
          </div>
          <p className="text-sm text-white/80">Berdasarkan transaksi bulan terpilih</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-[#A3E635] to-[#65C466] rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Profit Bersih</p>
              <h3 className="text-2xl font-bold">{currency(report?.summary.net)}</h3>
            </div>
            <FileText className="w-8 h-8 text-white/80" />
          </div>
          <p className="text-sm text-white/80">Margin: {profitMargin}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Jumlah Hari Terdata</p>
              <h3 className="text-2xl font-bold">{monthlyData.length}</h3>
            </div>
            <Calendar className="w-8 h-8 text-white/80" />
          </div>
          <p className="text-sm text-white/80">Data harian pada bulan ini</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Tren Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
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
                formatter={(value: number) => [currency(value), 'Profit']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#65C466" strokeWidth={3} dot={{ fill: '#65C466', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
        >
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Perbandingan Pemasukan & Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
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
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#65C466" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white rounded-2xl shadow-sm border border-[#65C466]/10 overflow-hidden"
      >
        <div className="p-6 border-b border-[#65C466]/10">
          <h3 className="text-lg font-semibold text-[#1F2937]">Ringkasan Harian</h3>
        </div>

        {isMobile ? (
          <div className="space-y-3 p-4">
            {monthlyData.map((row, index) => (
              <motion.div
                key={`${row.month}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-2xl border border-[#65C466]/10 bg-[#F8FAFC] p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65C466]">{row.month}</p>
                    <p className="mt-2 text-sm text-[#6B7280]">Profit bersih harian</p>
                  </div>
                  <p className={`text-lg font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency(row.profit)}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3 border border-[#E5E7EB]">
                    <p className="text-[#6B7280]">Pemasukan</p>
                    <p className="mt-1 font-semibold text-green-600">{currency(row.pemasukan)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-[#E5E7EB]">
                    <p className="text-[#6B7280]">Pengeluaran</p>
                    <p className="mt-1 font-semibold text-red-600">{currency(row.pengeluaran)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F0FDF4]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F6B3A]">Tanggal</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#1F6B3A]">Pemasukan</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#1F6B3A]">Pengeluaran</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#1F6B3A]">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#65C466]/10">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-[#F0FDF4] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">{row.month}</td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{currency(row.pemasukan)}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">{currency(row.pengeluaran)}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-[#1F2937]">{currency(row.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
