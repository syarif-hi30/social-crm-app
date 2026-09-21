import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhatsAppQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppQrModal: React.FC<WhatsAppQrModalProps> = ({ isOpen, onClose }) => {
  const { addSocialChannel, addNotification, addAuditLog, addApiConnector } = useApp();
  const [activeTab, setActiveTab] = useState<'direct' | 'gateway' | 'scan'>('direct');
  const [step, setStep] = useState<'idle' | 'pairing' | 'connected'>('idle');
  const [phoneNumber, setPhoneNumber] = useState('+62 812-9988-7766');
  const [accountName, setAccountName] = useState('WhatsApp Utama (CS 1)');
  
  // Gateway State
  const [gatewayProvider, setGatewayProvider] = useState<'fonnte' | 'waha' | 'baileys' | 'ultramsg'>('fonnte');
  const [gatewayApiKey, setGatewayApiKey] = useState('');
  const [gatewayWebhookUrl, setGatewayWebhookUrl] = useState('');

  // Fixed QR Code URL that only changes when user clicks refresh or qrSeed changes
  const [qrSeed, setQrSeed] = useState<number>(1);
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WA_CRM_PAIRING_DEVICE_${qrSeed}`;
  }, [qrSeed]);

  if (!isOpen) return null;

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setStep('pairing');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Register channel into Supabase channels table
    await addSocialChannel({
      type: 'whatsapp',
      name: accountName || `WhatsApp (${phoneNumber})`,
      identifier: phoneNumber,
    });

    setStep('connected');
    addNotification('WhatsApp Berhasil Terhubung', `Nomor ${phoneNumber} berhasil didaftarkan sebagai saluran WhatsApp CRM.`, 'high', 'whatsapp');
    addAuditLog('WHATSAPP_CHANNEL_CONNECTED', `Connected WhatsApp channel: ${phoneNumber}`);
  };

  const handleGatewayConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setStep('pairing');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Register both channel and API connector
    await addSocialChannel({
      type: 'whatsapp',
      name: `${accountName} [${gatewayProvider.toUpperCase()}]`,
      identifier: phoneNumber,
    });

    await addApiConnector({
      name: `Gateway ${gatewayProvider.toUpperCase()} (${phoneNumber})`,
      platform: 'whatsapp',
      appId: `wa_gw_${gatewayProvider}_${Date.now()}`,
      apiKey: gatewayApiKey || 'sec_key_token',
      webhookUrl: gatewayWebhookUrl || `https://api.crm.cloud/webhook/whatsapp/${gatewayProvider}`,
      status: 'active',
      rateLimitMaxPerMin: 120,
    });

    setStep('connected');
    addNotification('WhatsApp Gateway Terhubung', `Konektor ${gatewayProvider.toUpperCase()} (${phoneNumber}) aktif.`, 'high', 'whatsapp');
    addAuditLog('WHATSAPP_GATEWAY_CONNECTED', `Gateway ${gatewayProvider} linked with ${phoneNumber}`);
  };

  const handleClose = () => {
    setStep('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Hubungkan Akun / Nomor WhatsApp</h3>
              <p className="text-[11px] text-slate-400">Pilih metode integrasi nomor WhatsApp ke CRM</p>
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
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tautkan Nomor Instan (Rekomendasi)</span>
            </button>
            <button
              onClick={() => setActiveTab('gateway')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'gateway'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>WhatsApp Gateway (Live Sync)</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'scan'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Info Scan QR</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {step === 'idle' && activeTab === 'direct' && (
            <form onSubmit={handleDirectConnect} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">Cara Termudah & Paling Cepat:</strong> Cukup masukkan nomor WhatsApp bisnis Anda di bawah. Nomor langsung aktif di sistem CRM untuk mengelola percakapan dan kontak pelanggan di Supabase.
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
                    placeholder="Contoh: WhatsApp Bisnis Utama"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nomor WhatsApp (dengan kode negara)</label>
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

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tautkan Nomor Ini ke Supabase CRM</span>
                </button>
              </div>
            </form>
          )}

          {step === 'idle' && activeTab === 'gateway' && (
            <form onSubmit={handleGatewayConnect} className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <Server className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Live WhatsApp Multi-Device Gateway:</strong> Untuk menerima dan membalas pesan WhatsApp asli dari HP secara 2-arah tanpa Meta Developer, gunakan gateway API (seperti Fonnte, WAHA, Wablas, atau Baileys).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Provider Gateway</label>
                  <select
                    value={gatewayProvider}
                    onChange={(e) => setGatewayProvider(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="fonnte">Fonnte (Indonesia Gateway)</option>
                    <option value="waha">WAHA (WhatsApp HTTP API)</option>
                    <option value="baileys">Baileys WebSocket Gateway</option>
                    <option value="ultramsg">UltraMsg API</option>
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">API Token / Device Key</label>
                  <input
                    type="password"
                    value={gatewayApiKey}
                    onChange={(e) => setGatewayApiKey(e.target.value)}
                    placeholder="Token dari dashboard gateway..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Webhook URL (Otomatis)</label>
                  <input
                    type="text"
                    value={gatewayWebhookUrl}
                    onChange={(e) => setGatewayWebhookUrl(e.target.value)}
                    placeholder="https://your-crm.vercel.app/api/webhook"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hubungkan Gateway & Simpan ke Supabase</span>
                </button>
              </div>
            </form>
          )}

          {step === 'idle' && activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Kenapa WhatsApp menolak scan gambar statis?</strong> Scanner "Perangkat Tertaut" di aplikasi WhatsApp HP mewajibkan handshake enkripsi Noise Protocol (WebSocket handshake) aktif dengan server WhatsApp.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="WhatsApp QR Code Static"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                  <button
                    onClick={() => setQrSeed((s) => s + 1)}
                    className="mt-2 text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh QR
                  </button>
                </div>

                <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  <p className="font-semibold text-slate-100">Solusi agar langsung bisa digunakan:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                    <li>Gunakan tab <strong className="text-emerald-400">Tautkan Nomor Instan</strong> untuk langsung menambahkan nomor ke CRM.</li>
                    <li>Atau gunakan tab <strong className="text-indigo-400">WhatsApp Gateway</strong> jika ingin menghubungkan service Fonnte/WAHA.</li>
                  </ol>
                  <button
                    onClick={() => setActiveTab('direct')}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Buka Tab Tautkan Nomor Instan
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'pairing' && (
            <div className="py-10 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100">Menghubungkan Saluran ke Supabase Cloud...</h4>
                <p className="text-xs text-slate-400">Mendaftarkan nomor {phoneNumber} ke tabel channels & mengaktifkan webhook router.</p>
              </div>
            </div>
          )}

          {step === 'connected' && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-100">Saluran WhatsApp Berhasil Ditautkan!</h4>
                <p className="text-xs text-slate-300">
                  Nomor <span className="font-mono text-emerald-400 font-semibold">{phoneNumber}</span> sekarang aktif sebagai saluran resmi di database Supabase CRM Anda.
                </p>
                <p className="text-[11px] text-slate-500 pt-2">
                  Anda dapat langsung membuka menu <strong>Omni-Channel Inbox</strong> atau <strong>Database Kontak</strong> untuk memulai percakapan.
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
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL Realtime Sync
          </span>
          <span className="text-slate-500">Supabase Cloud Ready</span>
        </div>
      </div>
    </div>
  );
};
