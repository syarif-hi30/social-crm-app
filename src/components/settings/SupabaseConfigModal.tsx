import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Key, Server, RefreshCw, X, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SupabaseConfigModal: React.FC = () => {
  const { isSupabaseModalOpen, setIsSupabaseModalOpen, supabaseConfig, updateSupabaseCredentials, refreshDataFromSupabase } = useApp();
  
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isSupabaseModalOpen) return null;

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setFeedback({ type: 'error', text: 'Supabase URL dan Anon Key tidak boleh kosong.' });
      return;
    }

    setIsTesting(true);
    setFeedback({ type: 'info', text: 'Menghubungkan ke Supabase...' });

    try {
      const result = await updateSupabaseCredentials(url.trim(), anonKey.trim());
      if (result.success) {
        setFeedback({ type: 'success', text: result.message });
      } else {
        setFeedback({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menyimpan konfigurasi.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySchemaNotice = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Konfigurasi Supabase Cloud Database</span>
              </h3>
              <p className="text-xs text-slate-400">Hubungkan database PostgreSQL & Realtime Supabase ke CRM</p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            supabaseConfig.isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            {supabaseConfig.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold">
                {supabaseConfig.isConfigured ? 'Supabase Database Aktif & Terkoneksi' : 'Supabase Belum Dikonfigurasi'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {supabaseConfig.isConfigured
                  ? 'Semua data kontak, pesan multi-platform, dan webhook disimpan secara real-time di cloud Supabase.'
                  : 'Masukkan URL & Anon Key Supabase di bawah. File schema SQL siap dieksekusi di Supabase Dashboard.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAndConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Project URL Supabase</span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 normal-case font-normal text-xs inline-flex items-center space-x-1"
                >
                  <span>Buka Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Anon Public API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dapat ditemukan di: <strong>Project Settings → API → Project API keys (anon/public)</strong>
              </p>
            </div>

            {feedback && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                feedback.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                {feedback.text}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  refreshDataFromSupabase();
                  setFeedback({ type: 'info', text: 'Memperbarui data dari Supabase...' });
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center space-x-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>

              <button
                type="submit"
                disabled={isTesting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{isTesting ? 'Menghubungkan...' : 'Simpan & Uji Koneksi'}</span>
              </button>
            </div>
          </form>

          {/* SQL Schema helper */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">File Skema Database (SQL)</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                supabase/schema.sql
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jalankan file <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">supabase/schema.sql</code> di menu <strong>SQL Editor</strong> di Supabase untuk membuat tabel <code className="text-emerald-400">contacts</code>, <code className="text-emerald-400">messages</code>, <code className="text-emerald-400">channels</code>, dan mengaktifkan <strong>Realtime</strong>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
