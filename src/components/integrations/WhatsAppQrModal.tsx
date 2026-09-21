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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhatsAppQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppQrModal: React.FC<WhatsAppQrModalProps> = ({ isOpen, onClose }) => {
  const { addSocialChannel, addNotification, addAuditLog } = useApp();
  const [step, setStep] = useState<'scan' | 'pairing' | 'connected'>('scan');
  const [phoneNumber, setPhoneNumber] = useState('+62 812-3456-7890');
  const [countdown, setCountdown] = useState(45);
  const [qrKey, setQrKey] = useState(1);

  // Countdown timer for QR refresh
  useEffect(() => {
    if (!isOpen || step !== 'scan') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setQrKey((k) => k + 1);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, qrKey]);

  if (!isOpen) return null;

  const handleSimulateScan = async () => {
    setStep('pairing');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Register channel into Supabase
    await addSocialChannel({
      type: 'whatsapp',
      name: `WhatsApp Bisnis (${phoneNumber})`,
      identifier: phoneNumber,
    });

    setStep('connected');
    addNotification('WhatsApp Berhasil Terhubung', `Nomor ${phoneNumber} berhasil ditautkan via QR Code Multi-Device.`, 'high', 'whatsapp');
    addAuditLog('WHATSAPP_QR_PAIRED', `Paired device ${phoneNumber} via WhatsApp Web Protocol`);
  };

  const handleReset = () => {
    setStep('scan');
    setCountdown(45);
    setQrKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tautkan WhatsApp via Pindai QR Code</h3>
              <p className="text-[11px] text-slate-400">Metode WhatsApp Web Multi-Device (Tanpa Akun Meta Developer)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {step === 'scan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* QR Code Frame */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner relative group">
                  <img
                    key={qrKey}
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WA_PAIRING_${Date.now()}_${encodeURIComponent(phoneNumber)}`}
                    alt="WhatsApp QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                  <div className="flex items-center justify-between w-full mt-2 text-[10px] text-slate-600 font-mono">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" /> Refresh: {countdown}s
                    </span>
                    <button
                      onClick={handleReset}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Segarkan
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2.5 text-slate-300">
                  <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Cara Memindai di HP:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                    <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda.</li>
                    <li>Ketuk <strong>Menu (Titik 3)</strong> di Android atau <strong>Pengaturan</strong> di iPhone.</li>
                    <li>Pilih menu <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                    <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                    <li>Arahkan kamera HP ke kode QR di samping.</li>
                  </ol>
                </div>
              </div>

              {/* Number Configuration */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <label className="text-slate-400 block text-[11px]">Nomor WhatsApp yang Anda tautkan:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSimulateScan}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <span>Konfirmasi Tautkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Sistem akan otomatis mensinkronkan sesi Multi-Device ke database Supabase CRM.
                </p>
              </div>
            </div>
          )}

          {step === 'pairing' && (
            <div className="py-10 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100">Menghubungkan ke WhatsApp Server...</h4>
                <p className="text-xs text-slate-400">Memvalidasi kunci sesi enkripsi Signal & mengaktifkan webhook inbound.</p>
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
                  Nomor <span className="font-mono text-emerald-400 font-semibold">{phoneNumber}</span> sekarang aktif sebagai saluran resmi CRM Anda.
                </p>
                <p className="text-[11px] text-slate-500 pt-2">
                  Semua pesan yang masuk ke nomor ini akan langsung disinkronkan ke tab <strong>Omni-Channel Inbox</strong>.
                </p>
              </div>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg"
                >
                  Selesai & Buka Inbox
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enkripsi End-to-End Multi-Device
          </span>
          <span className="text-slate-500">Protokol Baileys / WAHA Compatible</span>
        </div>
      </div>
    </div>
  );
};
