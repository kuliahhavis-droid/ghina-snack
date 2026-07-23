import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, Info, Plus, Edit2, Trash2, LogIn, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/ui/skeleton';

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const getActionIcon = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return <Plus className="w-3.5 h-3.5 text-emerald-600" />;
    case 'UPDATE':
      return <Edit2 className="w-3.5 h-3.5 text-blue-600" />;
    case 'DELETE':
      return <Trash2 className="w-3.5 h-3.5 text-red-600" />;
    case 'LOGIN':
      return <LogIn className="w-3.5 h-3.5 text-amber-600" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-slate-600" />;
  }
};

const getActionBg = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATE':
    case 'INSERT':
      return 'bg-emerald-50 border-emerald-100';
    case 'UPDATE':
      return 'bg-blue-50 border-blue-100';
    case 'DELETE':
      return 'bg-red-50 border-red-100';
    case 'LOGIN':
      return 'bg-amber-50 border-amber-100';
    default:
      return 'bg-slate-50 border-slate-100';
  }
};

const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!editName.trim() || !user) return;
    setSaving(true);
    try {
      // Update auth metadata
      await supabase.auth.updateUser({ data: { name: editName } });
      // Update public profile
      await supabase.from('users').update({ name: editName }).eq('id', user.id);
      // Refresh local state
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update name:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await apiRequest<{ success: boolean; data: AuditLog[] }>('/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-[#1F6B3A] mb-2">Profile</h1>
        <p className="text-[#6B7280]">Informasi akun dari backend</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-[#65C466] to-[#1F6B3A] rounded-full flex items-center justify-center shadow-lg">
              <User className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1F2937] mb-1">{user?.name ?? 'User'}</h3>
            <p className="text-sm text-[#6B7280] mb-4">{user?.role ?? '-'}</p>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-[#65C466]" />
              <span className="text-sm text-[#65C466] font-medium">Akun Terautentikasi</span>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10"
          >
            <h3 className="text-lg font-semibold text-[#1F2937] mb-6">Informasi Akun</h3>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </label>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-xs text-[#1F6B3A] hover:underline flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Ubah
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 text-[#1F2937] focus:border-[#1F6B3A] focus:ring-[#1F6B3A]"
                      placeholder="Masukkan nama Anda"
                    />
                    <button 
                      onClick={handleSaveName}
                      disabled={saving}
                      className="px-4 py-2 bg-[#1F6B3A] text-white rounded-xl text-sm font-medium hover:bg-[#16502A] disabled:opacity-50"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button 
                      onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="w-full rounded-xl bg-[#F5F7FA] px-4 py-3 text-[#1F2937]">{user?.name ?? '-'}</div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div className="w-full rounded-xl bg-[#F5F7FA] px-4 py-3 text-[#1F2937]">{user?.email ?? '-'}</div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Shield className="w-4 h-4" />
                  Role
                </label>
                <div className="w-full rounded-xl bg-[#F5F7FA] px-4 py-3 text-[#1F2937]">{user?.role ?? '-'}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#65C466]/10 flex flex-col h-[520px]"
          >
            <h3 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2 shrink-0">
              <Calendar className="w-5 h-5 text-[#65C466]" />
              Aktivitas Sistem
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 items-start py-1">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : user?.role !== 'ADMIN' ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center text-sm text-[#6B7280]">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
                  <p>Log aktivitas sistem hanya dapat diakses oleh Administrator.</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center text-sm text-[#6B7280]">
                  <Info className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
                  <p>Belum ada riwayat aktivitas tercatat.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-6 pt-2">
                  {logs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot / icon */}
                      <div className={`absolute -left-[28px] top-0.5 w-6 h-6 rounded-lg border flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110 ${getActionBg(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[#1F2937] leading-relaxed">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                          <span className="font-semibold text-[#1F6B3A]/80">{log.user?.name}</span>
                          <span>&bull;</span>
                          <span>{formatTimestamp(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
