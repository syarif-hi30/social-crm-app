import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Download,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Video,
  Facebook,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Platform } from '../../types';
import { EncryptionService } from '../../services/encryption';

export const ContactManager: React.FC = () => {
  const {
    contacts,
    addContact,
    deleteContact,
    users,
    addAuditLog,
    supabaseConfig,
    setIsSupabaseModalOpen,
    refreshDataFromSupabase,
    isLoading,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [unmaskedContactId, setUnmaskedContactId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    platform: 'whatsapp' as Platform,
    handle: '',
    status: 'lead' as 'lead' | 'customer' | 'vip' | 'prospect',
    tags: '',
    notes: '',
    nationalId: '',
    billingAddress: '',
    assignedTo: users[0]?.id || '',
  });

  const platformIcons: { [key in Platform]: { icon: any; color: string; bg: string } } = {
    whatsapp: { icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    tiktok: { icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    facebook: { icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    gmail: { icon: Mail, color: 'text-red-400', bg: 'bg-red-500/10' },
    telegram: { icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm);
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await addContact({
      name: formData.name,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      email: formData.email,
      phone: formData.phone,
      platform: formData.platform,
      handle: formData.handle || formData.phone || formData.email,
      status: formData.status,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : ['New Lead'],
      notes: formData.notes,
      unreadCount: 0,
      lastMessage: 'Kontak baru ditambahkan',
      lastMessageTime: 'Baru saja',
      encryptedPii: {
        nationalId: formData.nationalId ? EncryptionService.encrypt(formData.nationalId) : undefined,
        billingAddress: formData.billingAddress ? EncryptionService.encrypt(formData.billingAddress) : undefined,
      },
      assignedTo: formData.assignedTo || users[0]?.id || 'usr-1',
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      platform: 'whatsapp',
      handle: '',
      status: 'lead',
      tags: '',
      notes: '',
      nationalId: '',
      billingAddress: '',
      assignedTo: users[0]?.id || '',
    });
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kontak ${name}?`)) {
      await deleteContact(id);
    }
  };

  const toggleUnmaskPii = (contactId: string, name: string) => {
    if (unmaskedContactId === contactId) {
      setUnmaskedContactId(null);
    } else {
      setUnmaskedContactId(contactId);
      addAuditLog('VIEW_DECRYPTED_PII', `Viewing decrypted sensitive PII for ${name}`, 'medium');
    }
  };

  const exportEncryptedBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CRM_Supabase_Contacts_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAuditLog('EXPORT_CONTACTS_BACKUP', 'Exported encrypted contact records to JSON file', 'low');
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] bg-slate-900 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Database Kontak & Pelanggan Supabase
          </h2>
          <p className="text-xs text-slate-400">
            Penyimpanan data cloud PostgreSQL dengan enkripsi client-side AES-256 untuk NIK, nomor kartu, & alamat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshDataFromSupabase()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={exportEncryptedBackup}
            className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Kontak Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter berdasarkan nama, email, nomor telepon..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none w-full md:w-auto"
          >
            <option value="all">Semua Kanal Platform</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
            <option value="gmail">Gmail</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <th className="p-3.5 font-semibold">Pelanggan</th>
                <th className="p-3.5 font-semibold">Platform & Handle</th>
                <th className="p-3.5 font-semibold">Status Lead</th>
                <th className="p-3.5 font-semibold">Kontak</th>
                <th className="p-3.5 font-semibold">Perlindungan PII Vault</th>
                <th className="p-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const cfg = platformIcons[contact.platform] || platformIcons.whatsapp;
                  const Icon = cfg.icon;
                  const isUnmasked = unmaskedContactId === contact.id;

                  return (
                    <tr key={contact.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={contact.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800"
                          />
                          <div>
                            <div className="font-semibold text-slate-200">{contact.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              {(contact.tags || []).map((t) => (
                                <span key={t} className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px]">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <span className="text-slate-300 font-medium">{contact.handle || '-'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            contact.status === 'vip'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : contact.status === 'customer'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : contact.status === 'prospect'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {(contact.status || 'lead').toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3.5 space-y-0.5 text-slate-300">
                        {contact.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        {contact.encryptedPii?.nationalId || contact.encryptedPii?.billingAddress ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                {isUnmasked && contact.encryptedPii.nationalId
                                  ? EncryptionService.decrypt(contact.encryptedPii.nationalId)
                                  : EncryptionService.maskText(contact.encryptedPii.nationalId || '', 3)}
                              </span>
                              <button
                                onClick={() => toggleUnmaskPii(contact.id, contact.name)}
                                className="text-slate-400 hover:text-indigo-400 p-0.5"
                                title={isUnmasked ? 'Sembunyikan' : 'Buka Dekripsi PII'}
                              >
                                {isUnmasked ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            {contact.encryptedPii.billingAddress && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                {isUnmasked
                                  ? EncryptionService.decrypt(contact.encryptedPii.billingAddress)
                                  : EncryptionService.maskText(contact.encryptedPii.billingAddress, 4)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Tidak ada PII tersimpan</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Hapus kontak dari Supabase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-slate-300">Belum Ada Kontak Tersimpan</div>
                    <div className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      {supabaseConfig.isConfigured
                        ? 'Database Supabase aktif. Tambahkan kontak pertama Anda dengan tombol di atas.'
                        : 'Hubungkan database Supabase untuk menyimpan dan mengelola kontak secara realtime.'}
                    </div>
                    {!supabaseConfig.isConfigured && (
                      <button
                        onClick={() => setIsSupabaseModalOpen(true)}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow"
                      >
                        Konfigurasi Supabase Sekarang
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Tambah Kontak ke Supabase DB
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sarah Wijaya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Platform Kanal</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="gmail">Gmail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="+628123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Handle / Username</label>
                  <input
                    type="text"
                    placeholder="@sarah.wijaya"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Status Prospek</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="lead">Lead Baru</option>
                    <option value="prospect">Prospect Bisnis</option>
                    <option value="customer">Pelanggan Aktif</option>
                    <option value="vip">VIP Member</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Data Sensitif PII (Client-Side AES-256)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[10px]">NIK / Nomor KTP</label>
                    <input
                      type="text"
                      placeholder="Dienkripsi sebelum kirim"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[10px]">Alamat Pengiriman/Tagihan</label>
                    <input
                      type="text"
                      placeholder="Dienkripsi sebelum kirim"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Catatan Kebutuhan Pelanggan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/20"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
