/**
 * WAHA (WhatsApp HTTP API) Client Service
 * Official Documentation: https://waha.devlikeapro.com/
 */

export interface WahaConfig {
  serverUrl: string; // e.g. "http://localhost:3000" or "https://waha.yourdomain.com"
  apiKey: string;    // Optional API key configured in WAHA (X-Api-Key)
  session: string;   // Default session name (e.g. "default")
  enabled: boolean;
}

const STORAGE_KEY_WAHA = 'social_crm_waha_config';

export const getWahaConfig = (): WahaConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WAHA);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading WAHA config from localStorage:', e);
  }
  return {
    serverUrl: 'http://localhost:3000',
    apiKey: '',
    session: 'default',
    enabled: false,
  };
};

export const saveWahaConfig = (config: Partial<WahaConfig>): WahaConfig => {
  const current = getWahaConfig();
  const updated: WahaConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY_WAHA, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving WAHA config to localStorage:', e);
  }
  return updated;
};

const getHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  return headers;
};

/**
 * Format phone number to WhatsApp JID format (e.g. 628123456789@c.us)
 */
export const formatPhoneToWahaJid = (phone: string): string => {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  if (!clean.endsWith('@c.us')) {
    clean = `${clean}@c.us`;
  }
  return clean;
};

/**
 * Sync active Supabase credentials from Frontend to WAHA Gateway Server
 */
export const syncSupabaseToWaha = async (serverUrl = getWahaConfig().serverUrl): Promise<void> => {
  try {
    const url = localStorage.getItem('crm_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const anonKey = localStorage.getItem('crm_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!url || !anonKey || url.includes('your-project')) return;

    await fetch(`${serverUrl.replace(/\/+$/, '')}/api/config/supabase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anonKey }),
    });
  } catch (err) {
    // Non-blocking error
    console.warn('[WAHA Sync] Note: WAHA server offline or unable to receive Supabase config:', err);
  }
};

/**
 * Check WAHA server status and sessions
 */
export const fetchWahaSessionStatus = async (
  serverUrl = getWahaConfig().serverUrl,
  apiKey = getWahaConfig().apiKey,
  session = getWahaConfig().session
): Promise<{ success: boolean; status?: string; me?: any; error?: string }> => {
  try {
    // Auto-sync Supabase config to WAHA
    syncSupabaseToWaha(serverUrl);

    const url = `${serverUrl.replace(/\/+$/, '')}/api/sessions/${session}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, status: 'STOPPED', error: 'Sesi belum dibuat atau server WAHA belum dimulai.' };
      }
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      status: data.status, // 'WORKING', 'SCAN_QR_CODE', 'STARTING', 'FAILED', 'STOPPED'
      me: data.me,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Tidak dapat terhubung ke server WAHA. Pastikan Docker WAHA sedang berjalan.',
    };
  }
};

/**
 * Start or Restart WAHA Session
 */
export const startWahaSession = async (
  serverUrl = getWahaConfig().serverUrl,
  apiKey = getWahaConfig().apiKey,
  session = getWahaConfig().session
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `${serverUrl.replace(/\/+$/, '')}/api/sessions/start`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ name: session }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, message: errJson.message || `Gagal memulai sesi (HTTP ${res.status})` };
    }

    return { success: true, message: 'Sesi WAHA berhasil dimulai.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal terhubung ke WAHA.' };
  }
};

/**
 * Get Live QR Code URL from WAHA
 */
export const getWahaQrUrl = (
  serverUrl = getWahaConfig().serverUrl,
  session = getWahaConfig().session
): string => {
  const base = serverUrl.replace(/\/+$/, '');
  return `${base}/api/${session}/auth/qr?format=image&t=${Date.now()}`;
};

/**
 * Send Text Message via WAHA REST API
 */
export const sendWahaMessage = async (
  phone: string,
  text: string,
  config = getWahaConfig()
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!config.enabled) {
    return { success: false, error: 'WAHA Gateway belum diaktifkan di pengaturan.' };
  }

  try {
    const url = `${config.serverUrl.replace(/\/+$/, '')}/api/sendText`;
    const chatId = formatPhoneToWahaJid(phone);

    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(config.apiKey),
      body: JSON.stringify({
        session: config.session || 'default',
        chatId,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengirim pesan via WAHA.' };
  }
};
