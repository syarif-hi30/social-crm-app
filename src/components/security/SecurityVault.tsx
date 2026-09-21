import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Database,
  Cloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EncryptionService } from '../../services/encryption';

export const SecurityVault: React.FC = () => {
  const { auditLogs, addAuditLog, currentUser, addNotification, isSupabaseConnected } = useApp();
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);

  const handleRotateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput || masterKeyInput.length < 8) return;

    EncryptionService.setMasterKey(masterKeyInput);
    setKeySuccess(true);
    setTimeout(() => setKeySuccess(false), 2500);

    addAuditLog('SECURITY_MASTER_KEY_ROTATE', 'Master AES-256 Key updated successfully', 'high');
    addNotification('Kunci Enkripsi Diperbarui', 'Sistem berhasil merotasi master key AES-256.', 'high');
    setMasterKeyInput('');
  };

  const rbacMatrix = [
    { feature: 'Melihat Percakapan Real-Time', admin: true, manager: true, agent: true },
    { feature: 'Membalas Pesan Pelanggan', admin: true, manager: true, agent: true },
    { feature: 'Buka Dekripsi NIK / PII Pelanggan', admin: true, manager: true, agent: false },
    { feature: 'Konfigurasi Token API Sosial Media', admin: true, manager: false, agent: false },
    { feature: 'Pengaturan Database Supabase Cloud', admin: true, manager: true, agent: false },
    { feature: 'Rotasi Master Encryption Key', admin: true, manager: false, agent: false },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] bg-slate-900 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Keamanan Cloud & Vault Terenkripsi
          </h2>
          <p className="text-xs text-slate-400">
            Perlindungan AES-256-CBC, enkripsi PII client-side, otorisasi Supabase Row Level Security (RLS), dan audit log realtime.
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Client-Side AES-256
        </span>
      </div>

      {/* Encryption Master Key Section */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" /> Rotasi Kunci Utama Enkripsi (Master Vault Key)
            </h3>
            <p className="text-xs text-slate-400">
              Kunci ini digunakan untuk mengenkripsi data sensitif (NIK, Alamat, Nomor Billing) di browser sebelum disimpan ke Supabase Cloud.
            </p>
          </div>
          {keySuccess && (
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              Master Key Berhasil Diperbarui
            </span>
          )}
        </div>

        <form onSubmit={handleRotateKey} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Kunci Master Baru (Minimal 8 karakter)</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                placeholder="Masukkan passphrase master key baru..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={currentUser.role !== 'admin' || masterKeyInput.length < 8}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Simpan Master Key Baru
            </button>
          </div>
          {currentUser.role !== 'admin' && (
            <p className="text-[11px] text-amber-400">
              * Hanya pengguna dengan role ADMIN yang diizinkan merotasi kunci utama.
            </p>
          )}
        </form>
      </div>

      {/* RBAC Permission Matrix */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" /> Matriks Otorisasi Multi-User (Role-Based Access Control)
          </h3>
          <p className="text-xs text-slate-400">
            Hak akses fungsionalitas berdasarkan peran tim (Admin, Manager, Agent) yang diselaraskan dengan Supabase Auth & RLS.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-semibold">Fitur / Fungsionalitas Sistem</th>
                <th className="pb-2.5 font-semibold text-center">Admin</th>
                <th className="pb-2.5 font-semibold text-center">Manager</th>
                <th className="pb-2.5 font-semibold text-center">Support Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rbacMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 text-slate-200 font-medium">{item.feature}</td>
                  <td className="py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                      IZIN
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    {item.manager ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                        IZIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-bold">
                        DITOLAK
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {item.agent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                        IZIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-bold">
                        DITOLAK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Audit Trail */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Log Audit Keamanan (Supabase Realtime Audit Logs)</h3>
            <p className="text-xs text-slate-400">Pencatatan aktivitas sensitif pengguna tersinkronisasi ke tabel audit_logs di cloud</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{auditLogs.length} Entri Tercatat</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Belum ada aktivitas audit log keamanan yang dicatat.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Aksi seperti rotasi master key, manipulasi kontak, dan perubahan integrasi akan otomatis tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Pengguna</th>
                  <th className="pb-2 font-medium">Aksi Kode</th>
                  <th className="pb-2 font-medium">Rincian Target</th>
                  <th className="pb-2 font-medium">Tingkat Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="py-2 text-slate-400 font-mono">{log.timestamp}</td>
                    <td className="py-2 font-semibold text-slate-200">{log.userName}</td>
                    <td className="py-2 font-mono text-indigo-400">{log.action}</td>
                    <td className="py-2 text-slate-300">{log.target}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-400'
                            : log.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
