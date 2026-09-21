import { Contact, Message, SocialAccount, User, AuditLog, ApiConnector, NotificationItem } from '../types';
import { EncryptionService } from './encryption';

const STORAGE_KEYS = {
  USERS: 'crm_users_v1',
  CONTACTS: 'crm_contacts_v1',
  MESSAGES: 'crm_messages_v1',
  ACCOUNTS: 'crm_social_accounts_v1',
  AUDIT_LOGS: 'crm_audit_logs_v1',
  CONNECTORS: 'crm_api_connectors_v1',
  NOTIFICATIONS: 'crm_notifications_v1',
  ACTIVE_USER_ID: 'crm_active_user_id_v1',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Budi Santoso',
    email: 'budi.admin@perusahaan.co.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: 'Sekarang',
  },
  {
    id: 'usr-2',
    name: 'Siti Rahmawati',
    email: 'siti.manager@perusahaan.co.id',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: '5 menit lalu',
  },
  {
    id: 'usr-3',
    name: 'Andi Pratama',
    email: 'andi.agent@perusahaan.co.id',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'busy',
    lastSeen: '1 menit lalu',
  },
];

export const INITIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc-wa-1',
    platform: 'whatsapp',
    accountName: 'Official CS WhatsApp Business',
    handle: '+62 812-3456-7890',
    status: 'connected',
    followerCount: 14200,
    unreadInteractions: 5,
    lastSynced: '1 menit lalu',
    rateLimitUsage: 24,
    credentialsEncrypted: EncryptionService.encrypt('wa_secret_token_live_2026'),
  },
  {
    id: 'acc-ig-1',
    platform: 'instagram',
    accountName: '@brand_official_id',
    handle: '@brand_official_id',
    status: 'connected',
    followerCount: 88500,
    unreadInteractions: 12,
    lastSynced: '3 menit lalu',
    rateLimitUsage: 45,
    credentialsEncrypted: EncryptionService.encrypt('ig_graph_access_token_v19'),
  },
  {
    id: 'acc-tt-1',
    platform: 'tiktok',
    accountName: 'Brand Shop TikTok Store',
    handle: '@brandshop_tiktok',
    status: 'connected',
    followerCount: 230400,
    unreadInteractions: 19,
    lastSynced: 'Sekarang',
    rateLimitUsage: 62,
    credentialsEncrypted: EncryptionService.encrypt('tiktok_open_api_key_2026'),
  },
  {
    id: 'acc-fb-1',
    platform: 'facebook',
    accountName: 'Brand Indonesia Official Page',
    handle: 'facebook.com/brandindonesia',
    status: 'connected',
    followerCount: 45100,
    unreadInteractions: 3,
    lastSynced: '10 menit lalu',
    rateLimitUsage: 18,
    credentialsEncrypted: EncryptionService.encrypt('fb_page_token_valid_forever'),
  },
  {
    id: 'acc-gm-1',
    platform: 'gmail',
    accountName: 'Corporate Helpdesk & Sales',
    handle: 'support@brandcompany.com',
    status: 'connected',
    followerCount: 3200,
    unreadInteractions: 2,
    lastSynced: '5 menit lalu',
    rateLimitUsage: 12,
    credentialsEncrypted: EncryptionService.encrypt('google_oauth_refresh_token_sec'),
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    name: 'Dewi Lestari',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    email: 'dewi.lestari@gmail.com',
    phone: '+62 813-8899-1122',
    platform: 'whatsapp',
    handle: '+62 813-8899-1122',
    status: 'vip',
    tags: ['Repeat Buyer', 'Premium Lead', 'Jabodetabek'],
    notes: 'Tertarik paket langganan tahunan corporate, meminta penawaran invoice.',
    unreadCount: 2,
    lastMessage: 'Halo min, apakah invoice sudah siap dikirimkan?',
    lastMessageTime: '10:42',
    encryptedPii: {
      nationalId: EncryptionService.encrypt('3171025508920004'),
      creditCardMasked: '4111-XXXX-XXXX-9021',
      billingAddress: EncryptionService.encrypt('Jl. Sudirman No. 45, Jakarta Selatan'),
    },
    assignedTo: 'usr-3',
  },
  {
    id: 'cnt-2',
    name: 'Reza Rahardian',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'reza.business@outlook.com',
    phone: '+62 812-9900-3344',
    platform: 'instagram',
    handle: '@rezarahardian_art',
    status: 'customer',
    tags: ['Influencer', 'Reviewer Produk'],
    notes: 'Ingin kolaborasi endorse dan komisi affiliate TikTok/IG.',
    unreadCount: 1,
    lastMessage: 'Bisa minta rate card dan ketentuan afiliasi produk terbaru?',
    lastMessageTime: '09:15',
    encryptedPii: {
      nationalId: EncryptionService.encrypt('3273011204900008'),
      billingAddress: EncryptionService.encrypt('Dago Asri No. 12, Bandung'),
    },
    assignedTo: 'usr-2',
  },
  {
    id: 'cnt-3',
    name: 'Putri Ayu Kencana',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    email: 'putri.kencana@tiktokmail.com',
    phone: '+62 857-1122-3344',
    platform: 'tiktok',
    handle: '@putri_kencanaxyz',
    status: 'lead',
    tags: ['Live Shopping', 'Flash Sale Promo'],
    notes: 'Tanya stok varian limited edition saat sesi live semalam.',
    unreadCount: 3,
    lastMessage: 'Kak barang yang di etalase nomor 4 masih ada bonus voucher?',
    lastMessageTime: 'Kemarin',
    encryptedPii: {
      billingAddress: EncryptionService.encrypt('Jl. Pemuda No. 88, Surabaya'),
    },
    assignedTo: 'usr-3',
  },
  {
    id: 'cnt-4',
    name: 'Hendro Gunawan',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    email: 'h.gunawan@megacorp.id',
    phone: '+62 811-7788-9900',
    platform: 'gmail',
    handle: 'h.gunawan@megacorp.id',
    status: 'vip',
    tags: ['B2B Enterprise', 'RFQ'],
    notes: 'Permintaan proposal pengadaan 100 unit lisensi enterprise.',
    unreadCount: 0,
    lastMessage: 'Terima kasih, dokumen NDA sudah kami tanda tangani dan lampirkan.',
    lastMessageTime: 'Kemarin',
    encryptedPii: {
      nationalId: EncryptionService.encrypt('3578012301850002'),
      billingAddress: EncryptionService.encrypt('Kawasan Industri MM2100, Cikarang'),
    },
    assignedTo: 'usr-1',
  },
  {
    id: 'cnt-5',
    name: 'Maya Indrawati',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'maya.indra@facebook.com',
    phone: '+62 819-0102-0304',
    platform: 'facebook',
    handle: 'Maya Indrawati Official',
    status: 'prospect',
    tags: ['Facebook Ads', 'Inquiry'],
    notes: 'Mengklik iklan Facebook Lead Ads kampanye Q3.',
    unreadCount: 0,
    lastMessage: 'Berapa lama estimasi pengiriman untuk wilayah Denpasar?',
    lastMessageTime: '18 Sep',
    encryptedPii: {},
    assignedTo: 'usr-3',
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    contactId: 'cnt-1',
    platform: 'whatsapp',
    sender: 'contact',
    senderName: 'Dewi Lestari',
    content: 'Selamat pagi admin, kami ingin order 50 lisensi untuk cabang Surabaya.',
    timestamp: '10:30',
    status: 'read',
    isEncrypted: true,
  },
  {
    id: 'msg-2',
    contactId: 'cnt-1',
    platform: 'whatsapp',
    sender: 'agent',
    senderName: 'Andi Pratama',
    content: 'Selamat pagi Ibu Dewi! Tentu, untuk 50 lisensi corporate akan kami berikan diskon 20%.',
    timestamp: '10:35',
    status: 'read',
    isEncrypted: true,
  },
  {
    id: 'msg-3',
    contactId: 'cnt-1',
    platform: 'whatsapp',
    sender: 'contact',
    senderName: 'Dewi Lestari',
    content: 'Halo min, apakah invoice sudah siap dikirimkan?',
    timestamp: '10:42',
    status: 'delivered',
    isEncrypted: true,
  },
  {
    id: 'msg-4',
    contactId: 'cnt-2',
    platform: 'instagram',
    sender: 'contact',
    senderName: 'Reza Rahardian',
    content: 'Bisa minta rate card dan ketentuan afiliasi produk terbaru?',
    timestamp: '09:15',
    status: 'delivered',
    isEncrypted: true,
  },
  {
    id: 'msg-5',
    contactId: 'cnt-3',
    platform: 'tiktok',
    sender: 'contact',
    senderName: 'Putri Ayu Kencana',
    content: 'Kak barang yang di etalase nomor 4 masih ada bonus voucher?',
    timestamp: 'Kemarin',
    status: 'read',
    isEncrypted: false,
  },
  {
    id: 'msg-6',
    contactId: 'cnt-4',
    platform: 'gmail',
    sender: 'agent',
    senderName: 'Budi Santoso',
    content: 'Yth. Bapak Hendro, terlampir proposal penawaran enterprise beserta NDA.',
    timestamp: 'Kemarin',
    status: 'read',
    isEncrypted: true,
  },
  {
    id: 'msg-7',
    contactId: 'cnt-4',
    platform: 'gmail',
    sender: 'contact',
    senderName: 'Hendro Gunawan',
    content: 'Terima kasih, dokumen NDA sudah kami tanda tangani dan lampirkan.',
    timestamp: 'Kemarin',
    status: 'read',
    isEncrypted: true,
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-21 10:45:12',
    userId: 'usr-1',
    userName: 'Budi Santoso',
    action: 'DATA_ENCRYPTION_REKEY',
    target: 'Master Vault AES-256 Key Rotation',
    ip: '192.168.1.10 (Local)',
    severity: 'high',
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-21 10:30:05',
    userId: 'usr-3',
    userName: 'Andi Pratama',
    action: 'CLOUD_SYNC_DISPATCH',
    target: '24 Records Synced to Cloud DB',
    ip: '192.168.1.14 (Local)',
    severity: 'low',
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-21 09:15:30',
    userId: 'usr-2',
    userName: 'Siti Rahmawati',
    action: 'CUSTOMER_PII_DECRYPT_VIEW',
    target: 'Contact ID: cnt-1 (Dewi Lestari)',
    ip: '192.168.1.12 (Local)',
    severity: 'medium',
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-21 08:00:00',
    userId: 'usr-1',
    userName: 'Budi Santoso',
    action: 'USER_LOGIN_SUCCESS',
    target: 'Local Windows Desktop Session',
    ip: '127.0.0.1 (Local)',
    severity: 'low',
  },
];

export const INITIAL_CONNECTORS: ApiConnector[] = [
  {
    id: 'conn-1',
    platform: 'whatsapp',
    name: 'WhatsApp Business Cloud API (Meta)',
    appId: 'META-WA-99281726',
    apiKeyMasked: 'EAAQZ...99xA',
    webhookUrl: 'https://api.crm-enterprise.local/webhooks/whatsapp',
    status: 'active',
    rateLimitMaxPerMin: 1000,
    requestsUsed: 142,
    lastPing: '3 detik lalu',
  },
  {
    id: 'conn-2',
    platform: 'instagram',
    name: 'Instagram Graph API v19.0',
    appId: 'META-IG-4481029',
    apiKeyMasked: 'EAABk...88zQ',
    webhookUrl: 'https://api.crm-enterprise.local/webhooks/instagram',
    status: 'active',
    rateLimitMaxPerMin: 800,
    requestsUsed: 310,
    lastPing: '10 detik lalu',
  },
  {
    id: 'conn-3',
    platform: 'tiktok',
    name: 'TikTok for Business Messaging API',
    appId: 'TT-APP-771829',
    apiKeyMasked: 'tt_live_...44bb',
    webhookUrl: 'https://api.crm-enterprise.local/webhooks/tiktok',
    status: 'active',
    rateLimitMaxPerMin: 500,
    requestsUsed: 220,
    lastPing: '5 detik lalu',
  },
  {
    id: 'conn-4',
    platform: 'gmail',
    name: 'Google Workspace Gmail REST API',
    appId: 'GOOGLE-OAUTH-CLIENT-991',
    apiKeyMasked: 'ya29.a0...88x',
    webhookUrl: 'https://api.crm-enterprise.local/webhooks/gmail',
    status: 'active',
    rateLimitMaxPerMin: 600,
    requestsUsed: 48,
    lastPing: '1 menit lalu',
  },
  {
    id: 'conn-5',
    platform: 'custom_webhook',
    name: 'Custom ERP / Payment Gateway Webhook',
    appId: 'INTERNAL-WEBHOOK-HOOK-1',
    apiKeyMasked: 'whsec_...99ff',
    webhookUrl: 'https://api.crm-enterprise.local/webhooks/erp-sync',
    status: 'active',
    rateLimitMaxPerMin: 2000,
    requestsUsed: 430,
    lastPing: '20 detik lalu',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'message',
    platform: 'whatsapp',
    title: 'Pesan Baru WhatsApp',
    description: 'Dewi Lestari menanyakan status invoice pembelian 50 lisensi.',
    timestamp: '10:42',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-2',
    type: 'sync',
    title: 'Cloud Backup Berhasil',
    description: '350 interaksi dan 48 kontak baru tersinkronisasi ke Cloud PostgreSQL.',
    timestamp: '10:30',
    isRead: false,
    priority: 'low',
  },
  {
    id: 'notif-3',
    type: 'security',
    title: 'Akses Data Sensitif (PII)',
    description: 'Siti Rahmawati membuka data enkripsi NIK pelanggan cnt-1.',
    timestamp: '09:15',
    isRead: true,
    priority: 'medium',
  },
];

export class LocalStorageManager {
  static getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Local storage write failed:', e);
    }
  }

  static getContacts(): Contact[] {
    return this.getItem<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
  }

  static saveContacts(contacts: Contact[]): void {
    this.setItem(STORAGE_KEYS.CONTACTS, contacts);
  }

  static getMessages(): Message[] {
    return this.getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }

  static saveMessages(messages: Message[]): void {
    this.setItem(STORAGE_KEYS.MESSAGES, messages);
  }

  static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getAccounts(): SocialAccount[] {
    return this.getItem<SocialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }

  static saveAccounts(accounts: SocialAccount[]): void {
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static saveAuditLogs(logs: AuditLog[]): void {
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  static getConnectors(): ApiConnector[] {
    return this.getItem<ApiConnector[]>(STORAGE_KEYS.CONNECTORS, INITIAL_CONNECTORS);
  }

  static saveConnectors(connectors: ApiConnector[]): void {
    this.setItem(STORAGE_KEYS.CONNECTORS, connectors);
  }

  static getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(notifications: NotificationItem[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }
}
