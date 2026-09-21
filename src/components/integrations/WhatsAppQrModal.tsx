import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Server,
  Key,
  Terminal,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getWahaConfig,
  saveWahaConfig,
  fetchWahaSessionStatus,
  startWahaSession,
  getWahaQrUrl,
} from '../../services/waha';

interface WhatsAppQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppQrModal: React.FC<WhatsAppQrModalProps> = ({ isOpen, onClose }) => {
  const { addSocialChannel, addNotification, addAuditLog, addApiConnector } = useApp();
  const [activeTab, setActiveTab] = useState<'waha' | 'direct' | 'guide'>('waha');
  const [step, setStep] = useState<'idle' | 'pairing' | 'connected'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('+62 812-9988-7766');
  const [accountName, setAccountName] = useState('WhatsApp Bisnis (WAHA)');

  // WAHA State
  const [wahaServerUrl, setWahaServerUrl] = useState('http://localhost:3000');
  const [wahaApiKey, setWahaApiKey] = useState('');
  const [wahaSession, setWahaSession] = useState('default');
  const [wahaStatus, setWahaStatus] = useState<string | null>(null);
  const [wahaError, setWahaError] = useState<string | null>(null);
  const [wahaLoading, setWahaLoading] = useState(false);
  const [wahaQrTimestamp, setWahaQrTimestamp] = useState(Date.now());
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Load existing WAHA config on mount
  useEffect(() => {
    if (isOpen) {
      const cfg = getWahaConfig();
      setWahaServerUrl(cfg.serverUrl);
      setWahaApiKey(cfg.apiKey);
      setWahaSession(cfg.session);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestWahaConnection = async () => {
    setWahaLoading(true);
    setWahaError(null);
    setWahaStatus(null);

    try {
      const res = await fetchWahaSessionStatus(wahaServerUrl, wahaApiKey, wahaSession);
      if (res.success) {
        setWahaStatus(res.status || 'CONNECTED');
        if (res.status === 'SCAN_QR_CODE') {
          setWahaQrTimestamp(Date.now());
        } else if (res.status === 'WORKING') {
          addNotification('WAHA Online & Terhubung', `Sesi ${wahaSession} aktif dan terhubung ke WhatsApp.`, 'high', 'whatsapp');
        }
      } else {
        setWahaError(res.error || 'Tidak dapat menghubungi server WAHA.');
      }
    } finally {
      setWahaLoading(false);
    }
  };

  const handleStartWahaSession = async () => {
    setWahaLoading(true);
    setWahaError(null);
    try {
      const res = await startWahaSession(wahaServerUrl, wahaApiKey, wahaSession);
      if (res.success) {
        setWahaQrTimestamp(Date.now());
        await handleTestWahaConnection();
      } else {
        setWahaError(res.message);
      }
    } finally {
      setWahaLoading(false);
    }
  };

  const handleSaveWahaIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('pairing');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Save configuration in localStorage
    saveWahaConfig({
      serverUrl: wahaServerUrl,
      apiKey: wahaApiKey,
      session: wahaSession,
      enabled: true,
    });

    // Save channel into Supabase
    await addSocialChannel({
      type: 'whatsapp',
      name: `${accountName} (WAHA)`,
      identifier: phoneNumber,
    });

    // Save connector
    await addApiConnector({
      name: `WAHA Gateway (${wahaSession})`,
      platform: 'whatsapp',
      appId: `waha_${wahaSession}`,
      apiKey: wahaApiKey || 'waha_local_token',
      webhookUrl: `${wahaServerUrl}/api/webhook`,
      status: 'active',
      rateLimitMaxPerMin: 300,
    });

    setStep('connected');
    addNotification('WAHA Gateway Aktif', `Server WAHA di ${wahaServerUrl} berhasil terhubung ke CRM.`, 'high', 'whatsapp');
    addAuditLog('WAHA_INTEGRATION_CONFIGURED', `WAHA Session '${wahaSession}' at ${wahaServerUrl}`);
  };

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setStep('pairing');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await addSocialChannel({
      type: 'whatsapp',
      name: accountName || `WhatsApp (${phoneNumber})`,
      identifier: phoneNumber,
    });

    setStep('connected');
    addNotification('WhatsApp Berhasil Terhubung', `Nomor ${phoneNumber} berhasil ditambahkan ke saluran CRM.`, 'high', 'whatsapp');
    addAuditLog('WHATSAPP_CHANNEL_CONNECTED', `Connected WhatsApp channel: ${phoneNumber}`);
  };

  const copyDockerCommand = () => {
    const cmd = `docker run -d --name waha -p 3000:3000 -e "WHATSAPP_DEFAULT_ENGINE=NOWEB" devlikeapro/waha`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleClose = () => {
    setStep('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Integrasi WhatsApp via WAHA Gateway</h3>
              <p className="text-[11px] text-slate-400">WhatsApp HTTP API (WAHA) — Multi-Device REST & WebSocket Protocol</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        {step === 'idle' && (
          <div className="flex border-b border-slate-800 bg-slate-900/30 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('waha')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'waha'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Konfigurasi & Scan QR WAHA</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Cara Install WAHA (Docker)</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tautkan Nomor Manual</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {step === 'idle' && activeTab === 'waha' && (
            <form onSubmit={handleSaveWahaIntegration} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">WAHA (WhatsApp HTTP API):</strong> Server gateway ini menghubungkan CRM Anda langsung ke WhatsApp melalui REST API & QR Code WhatsApp Web resmi.
                </div>
              </div>

              {/* Endpoint Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1 font-semibold">WAHA Server URL</label>
                  <input
                    type="text"
                    required
                    value={wahaServerUrl}
                    onChange={(e) => setWahaServerUrl(e.target.value)}
                    placeholder="http://localhost:3000 atau https://waha.domainanda.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Nama Sesi</label>
                  <input
                    type="text"
                    required
                    value={wahaSession}
                    onChange={(e) => setWahaSession(e.target.value)}
                    placeholder="default"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">API Key / Token (Opsional)</label>
                  <input
                    type="password"
                    value={wahaApiKey}
                    onChange={(e) => setWahaApiKey(e.target.value)}
                    placeholder="X-Api-Key jika disetel di WAHA"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Nomor WhatsApp Anda</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons: Test Connection & Start Session */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestWahaConnection}
                  disabled={wahaLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${wahaLoading ? 'animate-spin' : ''}`} />
                  <span>Cek Status Sesi WAHA</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartWahaSession}
                  disabled={wahaLoading}
                  className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Mulai / Restart Sesi Saja</span>
                </button>
              </div>

              {/* Status Message */}
              {wahaStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Status Sesi WAHA: <strong className="font-mono uppercase">{wahaStatus}</strong>
                    </span>
                    {wahaStatus === 'SCAN_QR_CODE' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                        Menunggu Scan HP
                      </span>
                    )}
                  </div>

                  {/* Real Live QR Code from WAHA */}
                  {wahaStatus === 'SCAN_QR_CODE' && (
                    <div className="mt-3 p-4 bg-white rounded-xl flex flex-col items-center justify-center gap-2">
                      <p className="text-[11px] text-slate-800 font-semibold text-center">
                        Pindai QR ini di aplikasi WhatsApp HP Anda (Perangkat Tertaut):
                      </p>
                      <img
                        src={`${wahaServerUrl.replace(/\/+$/, '')}/api/${wahaSession}/auth/qr?format=image&t=${wahaQrTimestamp}`}
                        alt="WAHA Real QR Code"
                        className="w-48 h-48 object-contain rounded-lg border border-slate-300 shadow-sm"
                        onError={() => setWahaError('Gagal memuat gambar QR dari WAHA. Pastikan endpoint dapat diakses.')}
                      />
                      <button
                        type="button"
                        onClick={() => setWahaQrTimestamp(Date.now())}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold mt-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Segarkan Kode QR
                      </button>
                    </div>
                  )}

                  {wahaStatus === 'WORKING' && (
                    <p className="text-emerald-400 text-[11px]">
                      Sesi WhatsApp Anda sudah aktif dan terhubung! CRM siap mengirim dan menerima pesan secara langsung.
                    </p>
                  )}
                </div>
              )}

              {wahaError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Koneksi Gagal:</strong> {wahaError}
                    <p className="text-slate-400 mt-1">
                      Pastikan Docker WAHA sudah dijalankan di komputer / VPS Anda. Buka tab <strong>"Cara Install WAHA"</strong> untuk panduan instalasi.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit / Save */}
              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Konfigurasi WAHA & Aktifkan Saluran</span>
                </button>
              </div>
            </form>
          )}

          {step === 'idle' && activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <Terminal className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Cara Menjalankan WAHA di Komputer/VPS:</strong> WAHA dijalankan dengan Docker dalam 1 baris perintah.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block text-[11px]">
                  1. Jalankan Perintah Docker ini di Terminal / PowerShell Anda:
                </label>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-[11px] text-emerald-400">
                  <span className="overflow-x-auto whitespace-pre">
                    docker run -d --name waha -p 3000:3000 -e "WHATSAPP_DEFAULT_ENGINE=NOWEB" devlikeapro/waha
                  </span>
                  <button
                    type="button"
                    onClick={copyDockerCommand}
                    className="ml-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 transition-colors"
                    title="Salin Perintah"
                  >
                    {copiedCmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <label className="text-slate-200 font-semibold block">
                  2. Konfigurasi Webhook (Agar pesan masuk dari HP otomatis masuk ke CRM):
                </label>
                <p className="text-slate-400">
                  Jika Anda ingin pesan masuk otomatis diproses oleh Supabase/CRM, Anda bisa menyetel environment variable webhook saat menjalankan docker:
                </p>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-300">
                  -e "WHATSAPP_HOOK_URL=https://your-crm-webhook-url/api/webhook"
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <a
                  href="https://waha.devlikeapro.com/docs/how-to/quick-start/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-[11px]"
                >
                  <span>Buka Dokumentasi Resmi WAHA</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveTab('waha')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
                >
                  Kembali ke Konfigurasi WAHA
                </button>
              </div>
            </div>
          )}

          {step === 'idle' && activeTab === 'direct' && (
            <form onSubmit={handleDirectConnect} className="space-y-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-teal-300">Pendaftaran Nomor Manual:</strong> Daftarkan nomor WhatsApp langsung ke database Supabase tanpa harus menghubungkan server WAHA terlebih dahulu.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nama Saluran CRM</label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: WhatsApp CS 1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftarkan Saluran ke Supabase</span>
                </button>
              </div>
            </form>
          )}

          {step === 'pairing' && (
            <div className="py-10 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100">Menghubungkan Saluran ke Supabase & WAHA...</h4>
                <p className="text-xs text-slate-400">Mendaftarkan nomor {phoneNumber} dan mengaktifkan gateway REST router.</p>
              </div>
            </div>
          )}

          {step === 'connected' && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-100">WhatsApp Berhasil Terhubung!</h4>
                <p className="text-xs text-slate-300">
                  Saluran WhatsApp untuk <span className="font-mono text-emerald-400 font-semibold">{phoneNumber}</span> telah aktif di Supabase dan siap digunakan di <strong>Omni-Channel Inbox</strong>.
                </p>
              </div>
              <div className="pt-3 flex justify-center gap-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Buka Omni-Channel Inbox
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> WAHA HTTP REST & WebSocket API
          </span>
          <span className="text-slate-500">devlikeapro/waha Supported</span>
        </div>
      </div>
    </div>
  );
};
