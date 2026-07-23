import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { currency } from '../lib/format';
import { useIsMobile } from '../components/ui/use-mobile';
import { Skeleton } from '../components/ui/skeleton';

type Customer = {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  receivables: Array<{
    amount: string;
    paidAmount: string;
    status: string;
  }>;
};

type Receivable = {
  id: string;
  customerId: string;
  amount: string;
  paidAmount: string;
  status: string;
  dueDate: string;
  notes: string | null;
  customer: {
    name: string;
    phone: string | null;
  };
};

export default function CustomersPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'customers' | 'receivables'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Customer Form states
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Payment Form states (Cicilan Piutang)
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payingRx, setPayingRx] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, rxRes] = await Promise.all([
        apiRequest<{ success: boolean; data: Customer[] }>('/customers'),
        apiRequest<{ success: boolean; data: Receivable[] }>('/receivables'),
      ]);
      setCustomers(custRes.data);
      setReceivables(rxRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddCustomer = () => {
    setEditingCustomerId(null);
    setCustName('');
    setCustContact('');
    setCustPhone('');
    setCustAddress('');
    setIsCustomerOpen(true);
  };

  const openEditCustomer = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setCustName(cust.name);
    setCustContact(cust.contact || '');
    setCustPhone(cust.phone || '');
    setCustAddress(cust.address || '');
    setIsCustomerOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCustomer(true);
      const payload = {
        name: custName,
        contact: custContact || null,
        phone: custPhone || null,
        address: custAddress || null,
      };

      if (editingCustomerId) {
        await apiRequest(`/customers/${editingCustomerId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      setIsCustomerOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan reseller');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data reseller ini?')) return;
    try {
      await apiRequest(`/customers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus reseller');
    }
  };

  // Payment towards receivable handler
  const openPayReceivable = (rx: Receivable) => {
    setPayingRx(rx);
    const maxPayable = Number(rx.amount) - Number(rx.paidAmount);
    setPayAmount(String(maxPayable));
    setPayNotes('');
    setIsPayOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRx) return;
    try {
      setSubmittingPayment(true);
      await apiRequest(`/receivables/${payingRx.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          notes: payNotes || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      setIsPayOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal merekam cicilan pembayaran');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getCustomerUnpaidDebt = (cust: Customer) => {
    return cust.receivables.reduce((acc, curr) => {
      if (curr.status !== 'PAID') {
        return acc + (Number(curr.amount) - Number(curr.paidAmount));
      }
      return acc;
    }, 0);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const filteredReceivables = receivables.filter(
    (r) =>
      r.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F6B3A]">Reseller &amp; Piutang Dagang</h1>
          <p className="text-sm text-[#6B7280]">Pantau keagenan reseller, pencatatan piutang konsinyasi, dan tempo penjualan.</p>
        </div>
        {activeTab === 'customers' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddCustomer}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] px-5 py-3 text-sm font-semibold text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            Tambah Reseller
          </motion.button>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => {
            setActiveTab('customers');
            setSearch('');
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-0.5 ${
            activeTab === 'customers'
              ? 'border-[#1F6B3A] text-[#1F6B3A]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F6B3A]'
          }`}
        >
          Daftar Reseller / Pelanggan
        </button>
        <button
          onClick={() => {
            setActiveTab('receivables');
            setSearch('');
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-0.5 ${
            activeTab === 'receivables'
              ? 'border-[#1F6B3A] text-[#1F6B3A]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F6B3A]'
          }`}
        >
          Piutang Dagang (Tempo)
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#65C466]/10 bg-white px-4 py-3 shadow-sm max-w-md">
        <Search className="h-5 w-5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder={
            activeTab === 'customers'
              ? 'Cari reseller berdasarkan nama...'
              : 'Cari piutang berdasarkan nama pelanggan...'
          }
          className="w-full text-sm text-[#1F2937] outline-none placeholder-[#94A3B8]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#65C466]/10 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-7 w-1/2" />
              <div className="space-y-2 text-sm text-[#6B7280]">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
          {error}
        </div>
      ) : activeTab === 'customers' ? (
        /* Tab 1: Customers */
        filteredCustomers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#65C466]/10 bg-white text-[#6B7280]">
            <Users className="h-12 w-12 text-[#94A3B8] mb-2" />
            <p className="text-sm">Tidak ada reseller ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((cust) => {
              const unpaidDebt = getCustomerUnpaidDebt(cust);
              return (
                <motion.div
                  key={cust.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-[#65C466]/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#1F6B3A]">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditCustomer(cust)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-[#1F2937]">{cust.name}</h3>

                  <div className="mb-4 space-y-2 text-sm text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#94A3B8]" />
                      <span>{cust.phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[#94A3B8] mt-0.5" />
                      <span className="line-clamp-2">{cust.address || 'No address details'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Total Piutang Berjalan</p>
                    <p
                      className={`text-base font-bold ${
                        unpaidDebt > 0 ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {currency(unpaidDebt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab 2: Receivables */
        filteredReceivables.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#65C466]/10 bg-white text-[#6B7280]">
            <CreditCard className="h-12 w-12 text-[#94A3B8] mb-2" />
            <p className="text-sm">Tidak ada piutang dagang ditemukan.</p>
          </div>
        ) : isMobile ? (
          /* Mobile Card View for Receivables */
          <div className="grid grid-cols-1 gap-4">
            {filteredReceivables.map((rx) => {
              const total = Number(rx.amount);
              const paid = Number(rx.paidAmount);
              const balance = total - paid;
              const isOverdue = new Date(rx.dueDate) < new Date() && rx.status !== 'PAID';

              return (
                <motion.div
                  key={rx.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#65C466]/10 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{rx.customer.name}</h4>
                      {rx.notes && <p className="text-xs text-slate-400 mt-0.5">{rx.notes}</p>}
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                        <Calendar className="h-3 w-3" />
                        Jatuh Tempo: {new Date(rx.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        rx.status === 'PAID'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : rx.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                      }`}
                    >
                      {rx.status === 'PAID' ? 'Lunas' : rx.status === 'PARTIAL' ? 'Cicilan' : 'Tempo'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-2.5">
                    <div>
                      <p className="text-slate-400">Total Piutang</p>
                      <p className="font-bold text-slate-700">{currency(total)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Terbayar</p>
                      <p className="font-bold text-green-700">{currency(paid)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Sisa Tagihan</p>
                      <p className="font-bold text-red-600">{currency(balance)}</p>
                    </div>
                  </div>
                  {rx.status !== 'PAID' && (
                    <div className="flex justify-end border-t border-slate-100 pt-2">
                      <button
                        onClick={() => openPayReceivable(rx)}
                        className="rounded-xl bg-[#F0FDF4] px-4 py-2 text-xs font-bold text-[#1F6B3A] border border-[#65C466]/20 hover:bg-[#1F6B3A] hover:text-white transition-all w-full text-center"
                      >
                        Bayar / Cicil
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View for Receivables */
          <div className="overflow-hidden rounded-2xl border border-[#65C466]/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-[#1F2937]">
                <thead className="border-b border-[#F3F4F6] bg-[#F9FAFB] text-xs font-semibold uppercase text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4">Pelanggan</th>
                    <th className="px-6 py-4">Jatuh Tempo</th>
                    <th className="px-6 py-4">Total Piutang</th>
                    <th className="px-6 py-4">Terbayar</th>
                    <th className="px-6 py-4">Sisa Tagihan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filteredReceivables.map((rx) => {
                    const total = Number(rx.amount);
                    const paid = Number(rx.paidAmount);
                    const balance = total - paid;
                    const isOverdue = new Date(rx.dueDate) < new Date() && rx.status !== 'PAID';

                    return (
                      <tr key={rx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-[#1F2937]">
                          {rx.customer.name}
                          <p className="text-xs font-normal text-[#6B7280]">{rx.notes || ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              isOverdue ? 'text-red-600 font-bold' : 'text-[#6B7280]'
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {new Date(rx.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{currency(total)}</td>
                        <td className="px-6 py-4 text-green-700">{currency(paid)}</td>
                        <td className="px-6 py-4 font-bold text-[#1F2937]">{currency(balance)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              rx.status === 'PAID'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : rx.status === 'PARTIAL'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                  : 'bg-red-50 text-red-600 border border-red-100'
                            }`}
                          >
                            {rx.status === 'PAID' ? 'Lunas' : rx.status === 'PARTIAL' ? 'Cicilan' : 'Tempo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {rx.status !== 'PAID' && (
                            <button
                              onClick={() => openPayReceivable(rx)}
                              className="rounded-xl bg-[#F0FDF4] px-3.5 py-1.5 text-xs font-bold text-[#1F6B3A] border border-[#65C466]/20 hover:bg-[#1F6B3A] hover:text-white transition-colors"
                            >
                              Bayar / Cicil
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal CRUD Customer */}
      <AnimatePresence>
        {isCustomerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-[#65C466]/10 bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1F6B3A]">
                  {editingCustomerId ? 'Edit Reseller' : 'Tambah Reseller Baru'}
                </h3>
                <button
                  onClick={() => setIsCustomerOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nama Reseller *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: Toko Snack Berkah"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Nama Kontak (CP)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: Ibu Fatimah"
                    value={custContact}
                    onChange={(e) => setCustContact(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">No. Telepon / WA</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: 08129876543"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Alamat Pengiriman / Toko</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Alamat lengkap toko reseller..."
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustomer}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-50"
                  >
                    {submittingCustomer ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cicil/Bayar Piutang */}
      <AnimatePresence>
        {isPayOpen && payingRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-[#65C466]/10 bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1F6B3A]">Menerima Cicilan/Pelunasan</h3>
                <button
                  onClick={() => setIsPayOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  &times;
                </button>
              </div>

              <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-[#6B7280] space-y-1.5">
                <p><strong>Reseller:</strong> {payingRx.customer.name}</p>
                <p><strong>Total Piutang:</strong> {currency(Number(payingRx.amount))}</p>
                <p><strong>Sisa Tagihan:</strong> {currency(Number(payingRx.amount) - Number(payingRx.paidAmount))}</p>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Jumlah Pembayaran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={Number(payingRx.amount) - Number(payingRx.paidAmount)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">Catatan Pembayaran</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#65C466]"
                    placeholder="Contoh: Pembayaran cicilan kedua via transfer Mandiri"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#65C466] to-[#1F6B3A] py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-50"
                  >
                    {submittingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
