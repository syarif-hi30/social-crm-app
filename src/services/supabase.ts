import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Contact, Message, SocialAccount, AuditLog, ApiConnector, CannedResponse, SupabaseConfig } from '../types';

const STORAGE_URL_KEY = 'crm_supabase_url';
const STORAGE_KEY_KEY = 'crm_supabase_anon_key';

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const savedUrl = localStorage.getItem(STORAGE_URL_KEY) || envUrl;
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  const isConfigured = Boolean(
    savedUrl &&
    savedKey &&
    !savedUrl.includes('your-project') &&
    !savedKey.includes('your-supabase-anon-key')
  );

  return {
    url: savedUrl,
    anonKey: savedKey,
    isConfigured,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  // Reset client instance so it re-instantiates with new credentials
  currentClient = null;
}

let currentClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  if (!currentClient) {
    try {
      currentClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return currentClient;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url.trim(), anonKey.trim());
    const { error } = await tempClient.from('contacts').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Perlu menjalankan SQL Schema untuk membuat tabel.',
        };
      }
      return { success: false, message: `Error Supabase: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke database Supabase berhasil & tabel aktif!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghubungi endpoint Supabase' };
  }
}

// ==========================================
// REAL DATA OPERATIONS (NO DUMMY DATA)
// ==========================================

export async function dbFetchContacts(): Promise<Contact[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('contacts')
    .select('*')
    .order('last_activity', { ascending: false });

  if (error) {
    console.error('Error fetching contacts from Supabase:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name}`,
    email: row.email || '',
    phone: row.phone || '',
    platform: row.channel,
    handle: row.handle || '',
    status: row.status || 'lead',
    tags: row.tags || [],
    notes: row.notes || '',
    unreadCount: row.unread_count || 0,
    lastMessage: '',
    lastMessageTime: row.last_activity ? new Date(row.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
    encryptedPii: row.encrypted_pii || {},
    assignedTo: row.assigned_agent || 'Budi Santoso',
    totalSpend: Number(row.total_spend || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function dbCreateContact(contact: Partial<Contact>): Promise<Contact | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload: any = {
    name: contact.name,
    handle: contact.handle || '',
    channel: contact.platform,
    phone: contact.phone || '',
    email: contact.email || '',
    avatar_url: contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`,
    status: contact.status || 'lead',
    tags: contact.tags || [],
    encrypted_pii: contact.encryptedPii || {},
    assigned_agent: contact.assignedTo || 'Budi Santoso',
    total_spend: contact.totalSpend || 0,
    unread_count: 0,
    last_activity: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('contacts')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar_url,
    email: data.email,
    phone: data.phone,
    platform: data.channel,
    handle: data.handle,
    status: data.status,
    tags: data.tags,
    notes: '',
    unreadCount: data.unread_count,
    lastMessage: '',
    lastMessageTime: 'Baru saja',
    encryptedPii: data.encrypted_pii,
    assignedTo: data.assigned_agent,
    totalSpend: Number(data.total_spend || 0),
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function dbUpdateContact(id: string, updates: Partial<Contact>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.handle !== undefined) payload.handle = updates.handle;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.encryptedPii !== undefined) payload.encrypted_pii = updates.encryptedPii;
  if (updates.assignedTo !== undefined) payload.assigned_agent = updates.assignedTo;
  if (updates.totalSpend !== undefined) payload.total_spend = updates.totalSpend;
  if (updates.unreadCount !== undefined) payload.unread_count = updates.unreadCount;
  payload.updated_at = new Date().toISOString();

  const { error } = await client.from('contacts').update(payload).eq('id', id);
  return !error;
}

export async function dbDeleteContact(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('contacts').delete().eq('id', id);
  return !error;
}

export async function dbFetchMessages(contactId: string): Promise<Message[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages from Supabase:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    contactId: row.contact_id,
    platform: row.channel,
    sender: row.sender === 'agent' ? 'agent' : 'contact',
    senderName: row.sender_name || (row.sender === 'agent' ? 'Admin' : 'Customer'),
    content: row.content,
    timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: row.status || 'read',
    isEncrypted: Boolean(row.encrypted_content),
    attachments: row.attachments || [],
    metadata: row.metadata || {},
  }));
}

export async function dbSendMessage(message: {
  contactId: string;
  platform: string;
  sender: 'contact' | 'agent' | 'bot';
  senderName: string;
  content: string;
  encryptedContent?: string;
}): Promise<Message | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    contact_id: message.contactId,
    channel: message.platform,
    sender: message.sender,
    sender_name: message.senderName,
    content: message.content,
    encrypted_content: message.encryptedContent || null,
    status: 'sent',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('messages')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error sending message to Supabase:', error);
    throw error;
  }

  return {
    id: data.id,
    contactId: data.contact_id,
    platform: data.channel,
    sender: data.sender === 'agent' ? 'agent' : 'contact',
    senderName: data.sender_name,
    content: data.content,
    timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: data.status,
    isEncrypted: Boolean(data.encrypted_content),
  };
}

export async function dbFetchChannels(): Promise<SocialAccount[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from('channels').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    platform: row.type,
    accountName: row.name,
    handle: row.identifier,
    status: row.status,
    followerCount: 0,
    unreadInteractions: 0,
    lastSynced: row.updated_at ? new Date(row.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Aktif',
    rateLimitUsage: 12,
    credentialsEncrypted: row.access_token || '',
    webhookSecret: row.webhook_secret || '',
  }));
}

export async function dbCreateChannel(channel: {
  type: string;
  name: string;
  identifier: string;
  webhookSecret?: string;
  accessToken?: string;
}): Promise<SocialAccount | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('channels')
    .insert([{
      type: channel.type,
      name: channel.name,
      identifier: channel.identifier,
      status: 'connected',
      webhook_secret: channel.webhookSecret || '',
      access_token: channel.accessToken || '',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating channel:', error);
    throw error;
  }

  return {
    id: data.id,
    platform: data.type,
    accountName: data.name,
    handle: data.identifier,
    status: data.status,
    followerCount: 0,
    unreadInteractions: 0,
    lastSynced: 'Baru saja',
    rateLimitUsage: 0,
    credentialsEncrypted: data.access_token || '',
    webhookSecret: data.webhook_secret || '',
  };
}

export async function dbFetchAuditLogs(): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    timestamp: new Date(row.created_at).toLocaleString(),
    userId: row.user_email,
    userName: row.user_email.split('@')[0],
    action: row.action,
    target: row.resource,
    ip: row.ip_address || '127.0.0.1',
    severity: row.severity === 'critical' ? 'high' : row.severity === 'warning' ? 'medium' : 'low',
  }));
}

export async function dbInsertAuditLog(log: {
  userEmail: string;
  action: string;
  resource: string;
  details?: string;
  severity?: 'info' | 'warning' | 'critical';
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client.from('audit_logs').insert([{
    user_email: log.userEmail,
    action: log.action,
    resource: log.resource,
    details: log.details || null,
    severity: log.severity || 'info',
  }]);
}

export async function dbFetchApiIntegrations(): Promise<ApiConnector[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from('api_integrations').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching API integrations:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    platform: (row.provider.includes('whatsapp') ? 'whatsapp' :
               row.provider.includes('meta') || row.provider.includes('instagram') ? 'instagram' :
               row.provider.includes('tiktok') ? 'tiktok' :
               row.provider.includes('gmail') ? 'gmail' :
               row.provider.includes('facebook') ? 'facebook' : 'custom_webhook') as any,
    name: row.name,
    appId: row.provider,
    apiKeyMasked: row.api_key ? `••••••••••••${row.api_key.slice(-4)}` : '••••••••••••AUTH',
    webhookUrl: row.webhook_url || '',
    status: row.status === 'active' ? 'active' : 'inactive',
    rateLimitMaxPerMin: row.rate_limit_per_minute || 60,
    requestsUsed: 0,
    lastPing: row.last_sync ? new Date(row.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Aktif',
  }));
}

export async function dbCreateApiIntegration(integration: {
  provider: string;
  name: string;
  apiKey?: string;
  webhookUrl?: string;
  apiUrl?: string;
}): Promise<ApiConnector | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('api_integrations')
    .insert([{
      provider: integration.provider,
      name: integration.name,
      api_key: integration.apiKey || '',
      webhook_url: integration.webhookUrl || '',
      api_url: integration.apiUrl || '',
      status: 'active',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating API integration:', error);
    throw error;
  }

  return {
    id: data.id,
    platform: (data.provider.includes('whatsapp') ? 'whatsapp' :
               data.provider.includes('meta') ? 'instagram' :
               data.provider.includes('tiktok') ? 'tiktok' :
               data.provider.includes('gmail') ? 'gmail' : 'custom_webhook') as any,
    name: data.name,
    appId: data.provider,
    apiKeyMasked: data.api_key ? `••••••••••••${data.api_key.slice(-4)}` : '••••••••••••AUTH',
    webhookUrl: data.webhook_url || '',
    status: 'active',
    rateLimitMaxPerMin: data.rate_limit_per_minute || 60,
    requestsUsed: 0,
    lastPing: 'Baru saja',
  };
}

export async function dbFetchCannedResponses(): Promise<CannedResponse[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from('canned_responses').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching canned responses:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    shortcut: row.shortcut,
    title: row.title,
    content: row.content,
    category: row.category,
  }));
}

// ==========================================
// SUPABASE REALTIME SUBSCRIPTION
// ==========================================
export function subscribeToRealtimeChanges(
  onNewMessage: (msg: any) => void,
  onContactUpdate: (contact: any) => void,
  onAuditLog: (log: any) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client.channel('crm_realtime_stream')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      onNewMessage(payload.new);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
      onContactUpdate(payload.new);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
      onAuditLog(payload.new);
    })
    .subscribe();

  return channel;
}
