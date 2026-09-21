import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Contact,
  Message,
  SocialAccount,
  CloudSyncState,
  NotificationItem,
  AuditLog,
  ApiConnector,
  Platform,
  SupabaseConfig,
} from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  dbFetchContacts,
  dbCreateContact,
  dbUpdateContact,
  dbDeleteContact,
  dbFetchMessages,
  dbSendMessage,
  dbFetchChannels,
  dbCreateChannel,
  dbFetchAuditLogs,
  dbInsertAuditLog,
  dbFetchApiIntegrations,
  dbCreateApiIntegration,
  subscribeToRealtimeChanges,
} from '../services/supabase';
import { EncryptionService } from '../services/encryption';

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-agent-1',
    name: 'Admin Utama (Anda)',
    email: 'admin@company.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: 'Sekarang',
  },
  {
    id: 'usr-agent-2',
    name: 'Sarah Manager',
    email: 'sarah@company.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: '5 menit lalu',
  },
  {
    id: 'usr-agent-3',
    name: 'Rian Support Lead',
    email: 'rian@company.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    lastSeen: '2 menit lalu',
  },
];

export const CURRENT_USER: User = DEFAULT_USERS[0];

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  messages: Message[];
  activeContactId: string | null;
  setActiveContactId: (id: string | null) => void;
  socialAccounts: SocialAccount[];
  channels: SocialAccount[];
  setSocialAccounts: React.Dispatch<React.SetStateAction<SocialAccount[]>>;
  cloudSync: CloudSyncState;
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  apiConnectors: ApiConnector[];
  apiIntegrations: ApiConnector[];
  selectedPlatformFilter: Platform | 'all';
  setSelectedPlatformFilter: (platform: Platform | 'all') => void;
  supabaseConfig: SupabaseConfig;
  isLoadingData: boolean;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;

  // Actions
  updateSupabaseCredentials: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  refreshDataFromSupabase: () => Promise<void>;
  sendMessage: (contactId: string, content: string, senderType?: 'agent' | 'contact' | 'bot' | 'system', platform?: Platform) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  addAuditLog: (action: string, target: string, severity?: 'low' | 'medium' | 'high') => Promise<void>;
  addContact: (contact: Omit<Contact, 'id'>) => Promise<Contact | null>;
  updateContactInfo: (id: string, updated: Partial<Contact>) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  addSocialChannel: (channel: { type: Platform; name: string; identifier: string; webhookSecret?: string }) => Promise<void>;
  addApiConnector: (connector: { provider?: string; platform?: Platform | 'custom_webhook'; name: string; appId?: string; apiKey?: string; apiKeyMasked?: string; webhookUrl?: string; status?: 'active' | 'inactive'; rateLimitMaxPerMin?: number; requestsUsed?: number; lastPing?: string }) => Promise<void>;
  testApiConnector: (connectorId: string) => Promise<boolean>;
  updateConnectorStatus: (connectorId: string, status: 'active' | 'inactive') => void;
  addNotification: (title: string, description: string, priority?: 'low' | 'medium' | 'high', platform?: Platform) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiConnectors, setApiConnectors] = useState<ApiConnector[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<Platform | 'all'>('all');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  const [cloudSync, setCloudSync] = useState<CloudSyncState>({
    status: supabaseConfig.isConfigured ? 'synced' : 'idle',
    lastSyncTime: null,
    pendingChangesCount: 0,
    cloudProvider: 'Supabase',
    cloudEndpoint: supabaseConfig.url || 'Belum Dikonfigurasi',
    autoSyncEnabled: true,
    syncIntervalMinutes: 1,
    isOnline: navigator.onLine,
    totalSyncedRecords: 0,
  });

  const addNotification = useCallback((
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    platform?: Platform
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: platform ? 'message' : 'system',
      platform,
      title,
      description,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      priority,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: description });
    }
  }, []);

  const addAuditLog = useCallback(async (
    action: string,
    target: string,
    severity: 'low' | 'medium' | 'high' = 'low'
  ) => {
    const localLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userId: currentUser.email,
      userName: currentUser.name,
      action,
      target,
      ip: 'Cloud Web Client',
      severity,
    };
    setAuditLogs((prev) => [localLog, ...prev.slice(0, 99)]);

    if (supabaseConfig.isConfigured) {
      await dbInsertAuditLog({
        userEmail: currentUser.email,
        action,
        resource: target,
        severity: severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'info',
      }).catch(console.error);
    }
  }, [currentUser, supabaseConfig.isConfigured]);

  // Load live data from Supabase
  const refreshDataFromSupabase = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [fetchedContacts, fetchedChannels, fetchedLogs, fetchedIntegrations] = await Promise.all([
        dbFetchContacts(),
        dbFetchChannels(),
        dbFetchAuditLogs(),
        dbFetchApiIntegrations(),
      ]);

      setContacts(fetchedContacts);
      setSocialAccounts(fetchedChannels);
      setAuditLogs(fetchedLogs);
      setApiConnectors(fetchedIntegrations);

      setCloudSync((prev) => ({
        ...prev,
        status: 'synced',
        lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        totalSyncedRecords: fetchedContacts.length + fetchedChannels.length + fetchedLogs.length,
      }));
    } catch (err) {
      console.error('Failed to fetch data from Supabase:', err);
      setCloudSync((prev) => ({ ...prev, status: 'error' }));
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch messages when active contact changes
  useEffect(() => {
    if (!activeContactId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    dbFetchMessages(activeContactId).then((msgs) => {
      if (isMounted) setMessages(msgs);
    });

    return () => {
      isMounted = false;
    };
  }, [activeContactId]);

  // Initial Data Load & Realtime Stream Subscription
  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseConfig(config);

    if (config.isConfigured) {
      refreshDataFromSupabase();

      // Subscribe to live Postgres changes
      const subscription = subscribeToRealtimeChanges(
        (newDbMsg) => {
          const formattedMsg: Message = {
            id: newDbMsg.id,
            contactId: newDbMsg.contact_id,
            platform: newDbMsg.channel,
            sender: newDbMsg.sender === 'agent' ? 'agent' : 'contact',
            senderName: newDbMsg.sender_name || 'Customer',
            content: newDbMsg.content,
            timestamp: new Date(newDbMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: newDbMsg.status || 'read',
            isEncrypted: Boolean(newDbMsg.encrypted_content),
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });

          // Also update contact unread count & last activity
          setContacts((prev) =>
            prev.map((c) =>
              c.id === formattedMsg.contactId
                ? {
                    ...c,
                    lastMessage: formattedMsg.content,
                    lastMessageTime: formattedMsg.timestamp,
                    unreadCount: formattedMsg.sender === 'contact' ? c.unreadCount + 1 : c.unreadCount,
                  }
                : c
            )
          );

          if (formattedMsg.sender === 'contact') {
            addNotification(
              `Pesan Masuk (${formattedMsg.platform.toUpperCase()})`,
              `${formattedMsg.senderName}: ${formattedMsg.content.substring(0, 60)}`,
              'high',
              formattedMsg.platform
            );
          }
        },
        () => {
          // Re-fetch contacts when changed in Supabase
          dbFetchContacts().then((data) => setContacts(data));
        },
        (newLog) => {
          setAuditLogs((prev) => [
            {
              id: newLog.id,
              timestamp: new Date(newLog.created_at).toLocaleString(),
              userId: newLog.user_email,
              userName: newLog.user_email.split('@')[0],
              action: newLog.action,
              target: newLog.resource,
              ip: newLog.ip_address || '127.0.0.1',
              severity: newLog.severity === 'critical' ? 'high' : newLog.severity === 'warning' ? 'medium' : 'low',
            },
            ...prev,
          ]);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setIsLoadingData(false);
    }
  }, [refreshDataFromSupabase, addNotification]);

  const updateSupabaseCredentials = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    const testResult = await testSupabaseConnection(url, anonKey);
    if (!testResult.success) {
      return testResult;
    }

    saveSupabaseConfig(url, anonKey);
    const updatedConfig = getSupabaseConfig();
    setSupabaseConfig(updatedConfig);

    setCloudSync((prev) => ({
      ...prev,
      cloudEndpoint: url,
      status: 'synced',
    }));

    await refreshDataFromSupabase();
    addAuditLog('UPDATE_SUPABASE_CREDENTIALS', `Connected to ${url}`, 'medium');
    addNotification('Supabase Terhubung', 'Aplikasi berhasil terhubung ke database cloud Supabase.', 'low');
    return testResult;
  };

  const sendMessage = async (
    contactId: string,
    content: string,
    senderType: 'agent' | 'contact' | 'bot' | 'system' = 'agent',
    platform?: Platform
  ) => {
    const targetContact = contacts.find((c) => c.id === contactId);
    const msgPlatform = platform || targetContact?.platform || 'whatsapp';
    const senderName = senderType === 'agent' ? currentUser.name : targetContact?.name || 'Contact';

    // Encrypt content for security
    const encryptedContent = EncryptionService.encrypt(content);

    const tempId = `msg-temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      contactId,
      platform: msgPlatform,
      sender: senderType,
      senderName,
      content,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isEncrypted: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              lastMessage: content,
              lastMessageTime: 'Sekarang',
              unreadCount: senderType === 'agent' ? 0 : c.unreadCount + 1,
            }
          : c
      )
    );

    if (supabaseConfig.isConfigured) {
      try {
        const saved = await dbSendMessage({
          contactId,
          platform: msgPlatform,
          sender: senderType === 'agent' ? 'agent' : senderType === 'bot' ? 'bot' : 'contact',
          senderName,
          content,
          encryptedContent,
        });

        if (saved) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        }
      } catch (err) {
        console.error('Failed to send message to Supabase:', err);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
      }
    }

    addAuditLog('SEND_CUSTOMER_MESSAGE', `Platform: ${msgPlatform.toUpperCase()} - Contact ID: ${contactId}`);
  };

  const addContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact | null> => {
    if (supabaseConfig.isConfigured) {
      try {
        const created = await dbCreateContact(contactData);
        if (created) {
          setContacts((prev) => [created, ...prev]);
          addAuditLog('CREATE_NEW_CONTACT', `Created contact ${created.name} (${created.platform})`);
          addNotification('Kontak Ditambahkan', `${created.name} berhasil disimpan ke Supabase.`);
          return created;
        }
      } catch (err) {
        console.error('Error inserting contact to Supabase:', err);
      }
    }

    // Fallback local state if Supabase is offline
    const localContact: Contact = {
      ...contactData,
      id: `cnt-${Date.now()}`,
    };
    setContacts((prev) => [localContact, ...prev]);
    addAuditLog('CREATE_NEW_CONTACT', `Created contact ${localContact.name} (Local)`);
    return localContact;
  };

  const updateContactInfo = async (id: string, updated: Partial<Contact>): Promise<boolean> => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));

    if (supabaseConfig.isConfigured) {
      await dbUpdateContact(id, updated);
    }
    addAuditLog('UPDATE_CONTACT_INFO', `Updated contact ID: ${id}`);
    return true;
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (activeContactId === id) setActiveContactId(null);

    if (supabaseConfig.isConfigured) {
      await dbDeleteContact(id);
    }
    addAuditLog('DELETE_CONTACT', `Deleted contact ID: ${id}`, 'medium');
    return true;
  };

  const addSocialChannel = async (channel: { type: Platform; name: string; identifier: string; webhookSecret?: string }) => {
    if (supabaseConfig.isConfigured) {
      try {
        const created = await dbCreateChannel(channel);
        if (created) {
          setSocialAccounts((prev) => [...prev, created]);
          addAuditLog('CONNECT_CHANNEL', `Connected channel ${created.accountName} (${created.platform})`);
          addNotification('Channel Terhubung', `${created.accountName} berhasil dihubungkan.`);
          return;
        }
      } catch (err) {
        console.error('Error creating channel:', err);
      }
    }

    const localAcc: SocialAccount = {
      id: `acc-${Date.now()}`,
      platform: channel.type,
      accountName: channel.name,
      handle: channel.identifier,
      status: 'connected',
      followerCount: 0,
      unreadInteractions: 0,
      lastSynced: 'Baru saja',
      rateLimitUsage: 0,
      credentialsEncrypted: '',
      webhookSecret: channel.webhookSecret,
    };
    setSocialAccounts((prev) => [...prev, localAcc]);
  };

  const addApiConnector = async (connector: {
    provider?: string;
    platform?: Platform | 'custom_webhook';
    name: string;
    appId?: string;
    apiKey?: string;
    apiKeyMasked?: string;
    webhookUrl?: string;
    status?: 'active' | 'inactive';
    rateLimitMaxPerMin?: number;
    requestsUsed?: number;
    lastPing?: string;
  }) => {
    const providerName = connector.provider || connector.platform || 'custom_webhook';
    if (supabaseConfig.isConfigured) {
      try {
        const created = await dbCreateApiIntegration({
          provider: providerName,
          name: connector.name,
          apiKey: connector.apiKey,
          webhookUrl: connector.webhookUrl,
        });
        if (created) {
          setApiConnectors((prev) => [...prev, created]);
          addAuditLog('ADD_API_INTEGRATION', `Added API integration ${created.name}`);
          addNotification('Integrasi Ditambahkan', `API ${created.name} siap menerima webhook.`);
          return;
        }
      } catch (err) {
        console.error('Error adding API integration:', err);
      }
    }

    const platformKey: Platform | 'custom_webhook' = connector.platform ||
      (providerName.includes('whatsapp') ? 'whatsapp' :
       providerName.includes('instagram') || providerName.includes('meta') ? 'instagram' :
       providerName.includes('tiktok') ? 'tiktok' :
       providerName.includes('gmail') ? 'gmail' :
       providerName.includes('facebook') ? 'facebook' :
       providerName.includes('telegram') ? 'telegram' : 'custom_webhook');

    const localConn: ApiConnector = {
      id: `conn-${Date.now()}`,
      platform: platformKey,
      name: connector.name,
      appId: connector.appId || providerName,
      apiKeyMasked: connector.apiKeyMasked || (connector.apiKey ? `••••••••${connector.apiKey.slice(-4)}` : '••••••••AUTH'),
      webhookUrl: connector.webhookUrl || '',
      status: connector.status || 'active',
      rateLimitMaxPerMin: connector.rateLimitMaxPerMin || 60,
      requestsUsed: connector.requestsUsed || 0,
      lastPing: connector.lastPing || 'Baru saja',
    };
    setApiConnectors((prev) => [...prev, localConn]);
  };

  const testApiConnector = async (connectorId: string): Promise<boolean> => {
    setApiConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'testing' } : c))
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    setApiConnectors((prev) =>
      prev.map((c) =>
        c.id === connectorId
          ? { ...c, status: 'active', lastPing: 'Baru saja', requestsUsed: c.requestsUsed + 1 }
          : c
      )
    );

    addAuditLog('API_CONNECTOR_PING_TEST', `Ping connector ID ${connectorId} successful`);
    return true;
  };

  const updateConnectorStatus = (connectorId: string, status: 'active' | 'inactive') => {
    setApiConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status } : c))
    );
    addAuditLog('UPDATE_CONNECTOR_STATUS', `Connector ${connectorId} set to ${status}`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        contacts,
        setContacts,
        messages,
        activeContactId,
        setActiveContactId,
        socialAccounts,
        channels: socialAccounts,
        setSocialAccounts,
        cloudSync,
        notifications,
        auditLogs,
        apiConnectors,
        apiIntegrations: apiConnectors,
        selectedPlatformFilter,
        setSelectedPlatformFilter,
        supabaseConfig,
        isLoadingData,
        isLoading: isLoadingData,
        isSupabaseConnected: supabaseConfig.isConfigured,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        updateSupabaseCredentials,
        refreshDataFromSupabase,
        sendMessage,
        markNotificationAsRead,
        addAuditLog,
        addContact,
        updateContactInfo,
        deleteContact,
        addSocialChannel,
        addApiConnector,
        testApiConnector,
        updateConnectorStatus,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

