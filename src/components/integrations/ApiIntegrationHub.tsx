import React, { useState } from 'react';
import {
  Webhook,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Key,
  Globe,
  Radio,
  Send,
  Sliders,
  MessageCircle,
  Instagram,
  Video,
  Facebook,
  Mail,
  Plus,
  Cloud,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiConnector, Platform } from '../../types';
import { WhatsAppQrModal } from './WhatsAppQrModal';

export const ApiIntegrationHub: React.FC = () => {
  const {
    apiConnectors,
    testApiConnector,
    addApiConnector,
    addNotification,
    addContact,
    sendMessage,
    isSupabaseConnected,
  } = useApp();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [webhookPlatform, setWebhookPlatform] = useState<Platform>('whatsapp');
  const [senderName, setSenderName] = useState('Pelanggan Baru');
  const [incomingMsg, setIncomingMsg] = useState('Halo min, mau tanya info layanan & harga.');
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // New connector form state
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [newConnName, setNewConnName] = useState('');
  const [newConnPlatform, setNewConnPlatform] = useState<Platform>('whatsapp');
  const [newConnAppId, setNewConnAppId] = useState('');
  const [newConnWebhookUrl, setNewConnWebhookUrl] = useState('');
  const [newConnApiKey, setNewConnApiKey] = useState('');

  const handleTestPing = async (id: string) => {
    setTestingId(id);
    await testApiConnector(id);
    setTestingId(null);
    addNotification('Koneksi API Berhasil', `Ping ke endpoint konektor ${id} berhasil merespon HTTP 200 OK.`, 'low');
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingMsg.trim() || !senderName.trim()) return;

    setIsSubmitting(true);
    try {
      const contact = await addContact({
        name: senderName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: `${senderName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: '+62 812-9988-7766',
        platform: webhookPlatform,
        handle: `@${senderName.toLowerCase().replace(/\s+/g, '_')}`,
        status: 'lead',
        tags: ['Webhook Inbound', 'Auto-Captured'],
        notes: `Pesan masuk otomatis dari integrasi API ${webhookPlatform.toUpperCase()}`,
        unreadCount: 1,
        lastMessage: incomingMsg,
        lastMessageTime: 'Baru Saja',
        encryptedPii: {},
        assignedTo: 'usr-1',
      });

      if (contact) {
        await sendMessage(contact.id, incomingMsg, 'contact', webhookPlatform);
      }

      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 2500);

      addNotification(
        `Webhook Payload Diterima (${webhookPlatform.toUpperCase()})`,
        `${senderName}: "${incomingMsg}" tersimpan di database Supabase.`,
        'high',
        webhookPlatform
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim() || !newConnAppId.trim()) return;

    await addApiConnector({
      name: newConnName,
      platform: newConnPlatform,
      appId: newConnAppId,
      webhookUrl: newConnWebhookUrl || `https://api.crm.cloud/v1/webhook/${newConnPlatform}`,
      apiKeyMasked: newConnApiKey ? `${newConnApiKey.substring(0, 4)}••••••••` : 'sec_live_••••••••',
      status: 'active',
      lastPing: 'Baru saja',
      rateLimitMaxPerMin: 120,
      requestsUsed: 0,
    });

    setShowAddConnector(false);
    setNewConnName('');
    setNewConnAppId('');
    setNewConnWebhookUrl('');
    setNewConnApiKey('');
  };

  const platformIcons: { [key: string]: { icon: any; color: string } } = {
    whatsapp: { icon: MessageCircle, color: 'text-emerald-400' },
    instagram: { icon: Instagram, color: 'text-pink-400' },
    tiktok: { icon: Video, color: 'text-rose-400' },
    facebook: { icon: Facebook, color: 'text-blue-400' },
    gmail: { icon: Mail, color: 'text-red-400' },
    custom_webhook: { icon: Webhook, color: 'text-indigo-400' },
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] bg-slate-900 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-400" /> Integrasi API Pihak Ketiga & Webhook Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Konektor resmi untuk WhatsApp Multi-Device (QR Code), WhatsApp Cloud API, Instagram Graph API, TikTok, dan Webhook.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Pindai QR WhatsApp</span>
          </button>

          <button
            onClick={() => setShowAddConnector(!showAddConnector)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Integrasi API</span>
          </button>
        </div>
      </div>

      {/* WhatsApp QR Modal Component */}
      <WhatsAppQrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />

      {/* Add Connector Modal / Collapse Form */}
      {showAddConnector && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Daftarkan Endpoint API / Webhook Baru ke Supabase
            </h3>
            <button
              onClick={() => setShowAddConnector(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleCreateConnector} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Nama Integrasi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: WhatsApp Cloud Production"
                  value={newConnName}
                  onChange={(e) => setNewConnName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Platform</label>
                <select
                  value={newConnPlatform}
                  onChange={(e) => setNewConnPlatform(e.target.value as Platform)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="instagram">Instagram Graph API</option>
                  <option value="tiktok">TikTok for Business</option>
                  <option value="facebook">Facebook Messenger API</option>
                  <option value="gmail">Google Gmail Push API</option>
                  <option value="custom_webhook">Custom Webhook Gateway</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">App ID / Client ID</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: app_wa_prod_01"
                  value={newConnAppId}
                  onChange={(e) => setNewConnAppId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Webhook Callback URL</label>
                <input
                  type="text"
                  placeholder="https://your-crm.vercel.app/api/webhook/..."
                  value={newConnWebhookUrl}
                  onChange={(e) => setNewConnWebhookUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">API Key / Secret Token</label>
              <input
                type="password"
                placeholder="sec_live_••••••••••••••••"
                value={newConnApiKey}
                onChange={(e) => setNewConnApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddConnector(false)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Simpan ke Supabase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Connectors Grid */}
      {apiConnectors.length === 0 ? (
        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
          <Webhook className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">Belum Ada Konektor API Terdaftar di Supabase</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Daftarkan integrasi webhook pertama Anda untuk menerima pesan realtime dari WhatsApp, Instagram, TikTok, dan kanal lainnya.
          </p>
          <button
            onClick={() => setShowAddConnector(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            + Tambah Integrasi API Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiConnectors.map((conn) => {
            const cfg = platformIcons[conn.platform] || { icon: Webhook, color: 'text-indigo-400' };
            const Icon = cfg.icon;
            const isTesting = testingId === conn.id;

            return (
              <div
                key={conn.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">{conn.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {conn.appId}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        conn.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {conn.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Webhook Callback:</span>
                      <span className="text-slate-200 truncate max-w-[200px]">{conn.webhookUrl}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>API Token (Vaulted):</span>
                      <span className="text-slate-200">{conn.apiKeyMasked}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Rate Limit:</span>
                      <span className="text-indigo-400 font-bold">
                        {conn.requestsUsed} / {conn.rateLimitMaxPerMin} req/min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">Terakhir: {conn.lastPing}</span>
                  <button
                    onClick={() => handleTestPing(conn.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Webhook Inbound Simulator */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Simulator Event Webhook Inbound (Live Supabase Sync)
            </h3>
            <p className="text-xs text-slate-400">
              Uji penerimaan payload pesan sosial media dari third-party API langsung tersimpan ke Supabase dan muncul di Inbox Realtime.
            </p>
          </div>

          {webhookSuccess && (
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              Payload Berhasil Disimpan ke Supabase!
            </span>
          )}
        </div>

        <form onSubmit={handleSimulateWebhook} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Kanal Asal Webhook</label>
              <select
                value={webhookPlatform}
                onChange={(e) => setWebhookPlatform(e.target.value as Platform)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="whatsapp">WhatsApp Business Cloud API</option>
                <option value="instagram">Instagram Direct Webhook</option>
                <option value="tiktok">TikTok Live / Messaging Webhook</option>
                <option value="facebook">Facebook Messenger Webhook</option>
                <option value="gmail">Google Gmail Push Notification (Pub/Sub)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nama Pengirim Eksternal</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Isi Pesan Payload</label>
            <input
              type="text"
              required
              value={incomingMsg}
              onChange={(e) => setIncomingMsg(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan ke Supabase...' : 'Kirim Inbound Payload ke Supabase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
