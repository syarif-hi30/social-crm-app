import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key,
  Globe,
  Copy,
  Check,
  Zap,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { testSupabaseConnection } from '../../services/supabase';

export const CloudSyncManager: React.FC = () => {
  const {
    supabaseConfig,
    updateSupabaseCredentials,
    refreshDataFromSupabase,
    isLoading,
    contacts,
    messages,
    channels,
    apiIntegrations,
    auditLogs,
    addNotification,
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Harap isi Project URL dan Anon Key terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(url.trim(), anonKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    addNotification('Kredensial Supabase Tersimpan', 'Sistem kini menggunakan database Supabase yang dikonfigurasi.', 'low');
  };

  const sqlSchemaSnippet = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT,
    email TEXT,
    phone TEXT,
    platform TEXT NOT NULL,
    handle TEXT,
    status TEXT DEFAULT 'lead',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    encrypted_pii JSONB DEFAULT '{}',
    assigned_to UUID,
    unread_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    channel TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    identifier TEXT NOT NULL,
    status TEXT DEFAULT 'connected',
    api_key TEXT,
    webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    endpoint TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    events TEXT[] DEFAULT '{}',
    last_triggered TIMESTAMPTZ,
    total_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    ip TEXT,
    severity TEXT DEFAULT 'low',
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] bg-slate-900 select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" /> Supabase Cloud Database & Realtime Sync
          </h2>
          <p className="text-xs text-slate-400">
            Penyimpanan data cloud PostgreSQL terpusat dengan dukungan Realtime WebSocket subscription & hosting Vercel.
          </p>
        </div>

        <button
          onClick={() => refreshDataFromSupabase()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Mengambil Data...' : 'Refresh dari Supabase'}</span>
        </button>
      </div>

      {/* Sync Status Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Status Supabase</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold flex items-center gap-2">
            {supabaseConfig.isConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Setup Diperlukan
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {supabaseConfig.isConfigured ? 'PostgreSQL API Aktif' : 'Masukkan URL & Anon Key'}
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tabel Kontak</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{contacts.length} Baris</div>
          <p className="text-[11px] text-slate-500">Tersinkronisasi Realtime</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tabel Pesan</span>
            <Zap className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{messages.length} Baris</div>
          <p className="text-[11px] text-slate-500">Live chat & omnichannel</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kanal & Integrasi</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{channels.length + apiIntegrations.length} Terhubung</div>
          <p className="text-[11px] text-slate-500">Webhook & API Endpoints</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" /> Kredensial Supabase Project
            </h3>
            <p className="text-xs text-slate-400">Masukkan Project URL dan Anon Key dari Supabase Dashboard Anda</p>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              Kredensial Berhasil Disimpan
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Supabase Project URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Supabase Anon Public API Key</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-lg text-xs transition"
            >
              {testing ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase'}
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition shadow-md shadow-indigo-600/20"
            >
              Simpan & Aktifkan Supabase
            </button>
          </div>
        </form>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Skema Database PostgreSQL Supabase
          </h3>
          <button
            onClick={copySqlToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Schema'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Salin dan jalankan query berikut di menu <strong>SQL Editor</strong> pada project Supabase Anda untuk membuat seluruh tabel, trigger realtime, dan RLS policies.
        </p>
        <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
          {sqlSchemaSnippet}
        </pre>
      </div>
    </div>
  );
};
