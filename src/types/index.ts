export type Platform = 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'gmail' | 'telegram';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  lastSeen: string;
}

export interface EncryptedPiiData {
  nationalId?: string;
  creditCardMasked?: string;
  billingAddress?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  platform: Platform;
  handle: string;
  status: 'lead' | 'customer' | 'vip' | 'prospect' | 'active' | 'archived';
  tags: string[];
  notes: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  encryptedPii: EncryptedPiiData;
  assignedTo: string;
  totalSpend?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  contactId: string;
  platform: Platform;
  sender: 'contact' | 'agent' | 'bot' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isEncrypted: boolean;
  attachments?: { name: string; url: string; type: string; size?: number }[];
  metadata?: Record<string, any>;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  handle: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  followerCount: number;
  unreadInteractions: number;
  lastSynced: string;
  rateLimitUsage: number;
  credentialsEncrypted: string;
  webhookSecret?: string;
}

export interface CloudSyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  pendingChangesCount: number;
  cloudProvider: 'Supabase' | 'AWS PostgreSQL' | 'Custom REST API';
  cloudEndpoint: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  isOnline: boolean;
  totalSyncedRecords: number;
}

export interface NotificationItem {
  id: string;
  type: 'message' | 'sync' | 'security' | 'system';
  platform?: Platform;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  ip: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ApiConnector {
  id: string;
  platform: Platform | 'custom_webhook';
  name: string;
  appId: string;
  apiKeyMasked: string;
  webhookUrl: string;
  status: 'active' | 'inactive' | 'testing';
  rateLimitMaxPerMin: number;
  requestsUsed: number;
  lastPing: string;
}

export interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
}

export interface AnalyticsMetric {
  date: string;
  whatsapp: number;
  instagram: number;
  tiktok: number;
  facebook: number;
  gmail: number;
  telegram?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

