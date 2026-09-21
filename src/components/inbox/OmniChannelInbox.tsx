import React, { useState } from 'react';
import {
  MessageCircle,
  Instagram,
  Video,
  Facebook,
  Mail,
  Send,
  Lock,
  Unlock,
  Shield,
  Tag,
  Paperclip,
  CheckCheck,
  Search,
  Zap,
  Plus,
  UserPlus,
  RefreshCw,
  Database,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Platform } from '../../types';
import { EncryptionService } from '../../services/encryption';

export const OmniChannelInbox: React.FC = () => {
  const {
    contacts,
    messages,
    sendMessage,
    selectedPlatformFilter,
    setSelectedPlatformFilter,
    addAuditLog,
    setIsSupabaseModalOpen,
    supabaseConfig,
    refreshDataFromSupabase,
    isLoading,
  } = useApp();

  const [activeContactId, setActiveContactId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPii, setShowPii] = useState(false);

  const filteredContacts = contacts
    .filter((c) => (selectedPlatformFilter === 'all' ? true : c.platform === selectedPlatformFilter))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    });

  const activeContact =
    contacts.find((c) => c.id === activeContactId) ||
    filteredContacts[0] ||
    contacts[0];

  const activeMessages = messages.filter((m) => m.contactId === activeContact?.id);

  const platformIcons: { [key in Platform]: { icon: any; color: string; bg: string; name: string } } = {
    whatsapp: { icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 text-emerald-400', name: 'WhatsApp' },
    instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10 text-pink-400', name: 'Instagram' },
    tiktok: { icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/10 text-rose-400', name: 'TikTok' },
    facebook: { icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10 text-blue-400', name: 'Facebook' },
    gmail: { icon: Mail, color: 'text-red-400', bg: 'bg-red-500/10 text-red-400', name: 'Gmail' },
    telegram: { icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10 text-sky-400', name: 'Telegram' },
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;
    const text = inputText;
    setInputText('');
    await sendMessage(activeContact.id, text);
  };

  const handlePiiDecryptToggle = () => {
    if (!showPii && activeContact) {
      addAuditLog('VIEW_DECRYPTED_PII', `Viewing decrypted sensitive data for ${activeContact.name}`, 'medium');
    }
    setShowPii(!showPii);
  };

  const cannedReplies = [
    'Halo, terima kasih telah menghubungi CRM kami.',
    'Mohon tunggu sebentar, tim kami sedang memproses permintaan Anda.',
    'Berikut kami kirimkan informasi dan penawaran terbaru.',
  ];

  return (
    <div className="flex flex-1 h-full bg-slate-950 overflow-hidden select-none">
      {/* 1. Left Contact List */}
      <div className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-slate-950">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Percakapan Masuk
            </h2>
            <button
              onClick={() => refreshDataFromSupabase()}
              disabled={isLoading}
              title="Refresh dari Supabase"
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan atau kontak..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Quick Platform Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <button
              onClick={() => setSelectedPlatformFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedPlatformFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({contacts.length})
            </button>
            {(Object.keys(platformIcons) as Platform[]).map((plt) => {
              const cfg = platformIcons[plt];
              const count = contacts.filter((c) => c.platform === plt).length;
              return (
                <button
                  key={plt}
                  onClick={() => setSelectedPlatformFilter(plt)}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedPlatformFilter === plt
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const cfg = platformIcons[contact.platform] || platformIcons.whatsapp;
              const Icon = cfg.icon;
              const isSelected = contact.id === activeContact?.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    setShowPii(false);
                  }}
                  className={`p-3 cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`}
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-slate-800`}>
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">{contact.name}</span>
                      <span className="text-[10px] text-slate-500">{contact.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {contact.lastMessage || 'Tidak ada pesan terbaru'}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                        {(contact.status || 'lead').toUpperCase()}
                      </span>
                      {contact.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500 text-white ml-auto">
                          {contact.unreadCount} baru
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-300">Belum Ada Kontak</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  {supabaseConfig.isConfigured
                    ? 'Database Supabase kosong. Buat kontak baru atau kirim pesan via webhook.'
                    : 'Sambungkan Supabase untuk memuat data live.'}
                </p>
              </div>
              {!supabaseConfig.isConfigured && (
                <button
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  Konfigurasi Supabase
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Chat Conversation */}
      {activeContact ? (
        <div className="flex-1 flex flex-col justify-between border-r border-slate-800 bg-slate-900/30">
          {/* Chat Header */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-3">
              <img
                src={activeContact.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`}
                alt={activeContact.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-100">{activeContact.name}</h3>
                  <span className="text-[10px] text-slate-500">({activeContact.handle || activeContact.email})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> Supabase Realtime Stream & AES-256
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Channel: {(activeContact.platform || 'whatsapp').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="text-center my-2">
              <span className="px-3 py-1 bg-slate-950 text-slate-400 text-[10px] rounded-full border border-slate-800">
                Tersinkronisasi Langsung ke Supabase PostgreSQL
              </span>
            </div>

            {activeMessages.length > 0 ? (
              activeMessages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="text-[10px] text-slate-500 px-1">{msg.senderName}</div>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isAgent
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1">
                      <span>{msg.timestamp}</span>
                      {isAgent && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                Belum ada riwayat pesan untuk kontak ini. Kirim pesan pertama di bawah!
              </div>
            )}
          </div>

          {/* Quick Canned Replies Bar */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Templat Balasan:
            </span>
            {cannedReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => setInputText(reply)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] whitespace-nowrap transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Message Composer Input Form */}
          <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tulis balasan untuk ${activeContact.name} via ${activeContact.platform}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/30">
          <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
            <MessageCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Tidak Ada Percakapan Aktif</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Pilih kontak dari daftar di sebelah kiri atau buat kontak baru di menu Database Kontak.
          </p>
        </div>
      )}

      {/* 3. Right CRM Customer Context Panel */}
      {activeContact && (
        <div className="w-80 bg-slate-950 p-5 overflow-y-auto space-y-5 shrink-0 border-l border-slate-800">
          <div className="text-center space-y-2 pb-4 border-b border-slate-800">
            <img
              src={activeContact.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`}
              alt={activeContact.name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-indigo-500/30 bg-slate-800"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-100">{activeContact.name}</h3>
              <p className="text-xs text-slate-400">{activeContact.email || 'Email tidak disetel'}</p>
              <p className="text-xs text-slate-400">{activeContact.phone || 'Nomor tidak disetel'}</p>
            </div>
          </div>

          {/* CRM Tags & Status */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tagging & Segmentasi
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(activeContact.tags || []).length > 0 ? (
                activeContact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Belum ada tags</span>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Catatan CRM
            </span>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed min-h-[60px]">
              {activeContact.notes || 'Belum ada catatan internal.'}
            </div>
          </div>

          {/* Encrypted Customer PII Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Sensitive PII Vault
              </span>
              <button
                onClick={handlePiiDecryptToggle}
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                {showPii ? <Unlock className="w-3 h-3 text-amber-400" /> : <Lock className="w-3 h-3 text-emerald-400" />}
                {showPii ? 'Sembunyikan' : 'Buka Dekripsi'}
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">NIK / No. Identitas:</span>
                <span className="text-slate-200">
                  {showPii && activeContact.encryptedPii?.nationalId
                    ? EncryptionService.decrypt(activeContact.encryptedPii.nationalId)
                    : EncryptionService.maskText(activeContact.encryptedPii?.nationalId || '', 3)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Alamat Tagihan:</span>
                <span className="text-slate-200">
                  {showPii && activeContact.encryptedPii?.billingAddress
                    ? EncryptionService.decrypt(activeContact.encryptedPii.billingAddress)
                    : EncryptionService.maskText(activeContact.encryptedPii?.billingAddress || '', 5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
