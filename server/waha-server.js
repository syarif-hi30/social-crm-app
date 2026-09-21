import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode';
import QRCodeTerminal from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';

// Load environment variables (.env or .env.local)
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

// Logger
const logger = pino({ level: 'info' });

// Supabase Client Setup for Direct Sync
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[Supabase Sync] Connected to: ${supabaseUrl}`);
  } catch (err) {
    console.error('[Supabase Sync] Failed to initialize Supabase client:', err.message);
  }
}

// In-Memory Sessions Storage
const SESSIONS = new Map();
const SESSIONS_DIR = path.join(__dirname, '..', 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Format phone string to JID
 */
function toJid(phone) {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  if (!clean.endsWith('@s.whatsapp.net') && !clean.endsWith('@c.us')) {
    clean = `${clean}@s.whatsapp.net`;
  }
  return clean.replace('@c.us', '@s.whatsapp.net');
}

/**
 * Format JID to clean phone number (+62 812-xxxx)
 */
function fromJidToPhone(jid) {
  if (!jid) return '';
  const num = jid.split('@')[0].split(':')[0];
  if (num.startsWith('62')) {
    return `+62 ${num.slice(2, 5)}-${num.slice(5, 9)}-${num.slice(9)}`;
  }
  return `+${num}`;
}

/**
 * Sync message to Supabase DB
 */
async function syncMessageToSupabase(sessionName, msg) {
  if (!supabase) return;

  try {
    const key = msg.key;
    const fromMe = key.fromMe;
    const jid = key.remoteJid;

    // Ignore status broadcast & group notifications if preferred
    if (jid === 'status@broadcast' || jid.endsWith('@g.us')) {
      return;
    }

    const cleanPhone = fromJidToPhone(jid);
    const pushName = msg.pushName || cleanPhone;

    // Extract text content
    let text = '';
    const messageContent = msg.message;
    if (!messageContent) return;

    if (messageContent.conversation) {
      text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
      text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage?.caption) {
      text = `📷 [Foto] ${messageContent.imageMessage.caption}`;
    } else if (messageContent.imageMessage) {
      text = '📷 [Foto]';
    } else if (messageContent.documentMessage?.title || messageContent.documentMessage?.fileName) {
      text = `📄 [Dokumen] ${messageContent.documentMessage.fileName || messageContent.documentMessage.title}`;
    } else if (messageContent.audioMessage) {
      text = '🎵 [Pesan Suara]';
    } else if (messageContent.videoMessage) {
      text = '🎥 [Video]';
    } else {
      text = '[Pesan WhatsApp]';
    }

    if (!text.trim()) return;

    // 1. Find or create contact in Supabase
    let contactId = null;
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, unread_count')
      .or(`phone.eq.${cleanPhone},handle.eq.${cleanPhone}`)
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      contactId = existingContacts[0].id;
      // Update contact's last message and unread count
      await supabase
        .from('contacts')
        .update({
          last_message: text,
          last_message_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          unread_count: fromMe ? 0 : (existingContacts[0].unread_count || 0) + 1,
        })
        .eq('id', contactId);
    } else {
      // Create new contact
      const { data: newContact, error: createContactErr } = await supabase
        .from('contacts')
        .insert({
          name: pushName,
          phone: cleanPhone,
          email: `${cleanPhone.replace(/[^0-9]/g, '')}@whatsapp.user`,
          platform: 'whatsapp',
          handle: cleanPhone,
          status: 'lead',
          tags: ['WhatsApp Inbound', 'WAHA Live'],
          notes: `Tersinkronisasi otomatis dari WAHA (${sessionName})`,
          unread_count: fromMe ? 0 : 1,
          last_message: text,
          last_message_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanPhone}`,
          assigned_to: 'usr-1',
        })
        .select('id')
        .single();

      if (newContact) {
        contactId = newContact.id;
      }
    }

    // 2. Insert message record
    if (contactId) {
      await supabase.from('messages').insert({
        contact_id: contactId,
        channel: 'whatsapp',
        sender: fromMe ? 'agent' : 'contact',
        sender_name: fromMe ? 'Admin / Agent' : pushName,
        content: text,
        status: 'delivered',
        created_at: new Date().toISOString(),
      });

      console.log(`[Supabase Sync] 📩 Message synced: ${cleanPhone} -> "${text.substring(0, 40)}"`);
    }
  } catch (err) {
    console.error('[Supabase Sync Error]:', err.message);
  }
}

/**
 * Initialize a Baileys WhatsApp Session
 */
async function initSession(sessionName = 'default') {
  if (SESSIONS.has(sessionName)) {
    const existing = SESSIONS.get(sessionName);
    if (existing.status === 'WORKING' || existing.status === 'SCAN_QR_CODE') {
      return existing;
    }
  }

  const sessionFolder = path.join(SESSIONS_DIR, sessionName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`[WAHA] Starting session '${sessionName}' using Baileys v${version.join('.')}`);

  const sessionData = {
    name: sessionName,
    status: 'STARTING',
    qrRaw: null,
    qrImageBuffer: null,
    sock: null,
    me: null,
  };

  SESSIONS.set(sessionName, sessionData);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: ['Social CRM Web', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true,
  });

  sessionData.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessionData.status = 'SCAN_QR_CODE';
      sessionData.qrRaw = qr;
      try {
        sessionData.qrImageBuffer = await qrcode.toBuffer(qr, { width: 300, margin: 2 });
      } catch (e) {
        console.error('Error generating QR code buffer:', e);
      }

      console.log(`\n================== WAHA SCAN QR (${sessionName}) ==================`);
      QRCodeTerminal.generate(qr, { small: true });
      console.log(`Scan QR di atas via WhatsApp HP -> Perangkat Tertaut / Linked Devices`);
      console.log(`===================================================================\n`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WAHA] Connection closed (code: ${statusCode}). Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        sessionData.status = 'STARTING';
        setTimeout(() => initSession(sessionName), 3000);
      } else {
        sessionData.status = 'STOPPED';
        sessionData.qrRaw = null;
        sessionData.qrImageBuffer = null;
        try {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        } catch (e) {}
      }
    } else if (connection === 'open') {
      sessionData.status = 'WORKING';
      sessionData.qrRaw = null;
      sessionData.qrImageBuffer = null;
      sessionData.me = sock.user;

      console.log(`\n🎉 [WAHA] WhatsApp connected successfully!`);
      console.log(`Akun: ${sock.user?.name || 'WhatsApp User'} (${sock.user?.id || ''})\n`);
    }
  });

  // Handle incoming & outgoing messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;

    for (const msg of messages) {
      await syncMessageToSupabase(sessionName, msg);
    }
  });

  return sessionData;
}

// ----------------------------------------------------------------------------
// WAHA REST API COMPATIBLE ROUTES
// ----------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WAHA - WhatsApp HTTP API (Node.js Gateway)',
    version: '2024.1.0',
    documentation: 'https://waha.devlikeapro.com/',
    sessions: Array.from(SESSIONS.keys()).map((k) => ({
      name: k,
      status: SESSIONS.get(k).status,
    })),
  });
});

/**
 * List all sessions
 */
app.get('/api/sessions', (req, res) => {
  const list = [];
  for (const [name, sess] of SESSIONS.entries()) {
    list.push({
      name,
      status: sess.status,
      me: sess.me,
    });
  }
  res.json(list);
});

/**
 * Get specific session status
 */
app.get('/api/sessions/:session', (req, res) => {
  const sessionName = req.params.session || 'default';
  const sess = SESSIONS.get(sessionName);
  if (!sess) {
    return res.status(404).json({
      name: sessionName,
      status: 'STOPPED',
      message: 'Sesi belum dimulai. Panggil POST /api/sessions/start untuk memulai.',
    });
  }
  res.json({
    name: sessionName,
    status: sess.status,
    me: sess.me,
  });
});

/**
 * Start session
 */
app.post('/api/sessions/start', async (req, res) => {
  const sessionName = req.body?.name || 'default';
  try {
    const sess = await initSession(sessionName);
    res.json({
      name: sessionName,
      status: sess.status,
      message: 'Sesi WAHA dimulai.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Stop session
 */
app.post('/api/sessions/stop', async (req, res) => {
  const sessionName = req.body?.name || 'default';
  const sess = SESSIONS.get(sessionName);
  if (sess && sess.sock) {
    sess.sock.end(new Error('Session stopped by user'));
    sess.status = 'STOPPED';
  }
  res.json({ name: sessionName, status: 'STOPPED' });
});

/**
 * Get QR Code (Image PNG)
 */
app.get('/api/:session/auth/qr', async (req, res) => {
  const sessionName = req.params.session || 'default';
  let sess = SESSIONS.get(sessionName);

  if (!sess || sess.status === 'STOPPED') {
    sess = await initSession(sessionName);
    // Wait briefly for QR generation
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (sess.status === 'WORKING') {
    return res.status(200).send('WhatsApp already connected (WORKING). No QR needed.');
  }

  if (sess.qrImageBuffer) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(sess.qrImageBuffer);
  }

  if (sess.qrRaw) {
    const buf = await qrcode.toBuffer(sess.qrRaw, { width: 300, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(buf);
  }

  res.status(202).json({
    status: sess.status,
    message: 'QR code sedang disiapkan. Silakan coba kembali dalam 2 detik.',
  });
});

/**
 * Send text message (WAHA Format)
 * Body: { "session": "default", "chatId": "628123456789@c.us", "text": "Halo..." }
 */
app.post('/api/sendText', async (req, res) => {
  const { session = 'default', chatId, text } = req.body;

  if (!chatId || !text) {
    return res.status(400).json({ error: 'Parameter chatId dan text wajib diisi.' });
  }

  const sess = SESSIONS.get(session);
  if (!sess || sess.status !== 'WORKING' || !sess.sock) {
    return res.status(503).json({
      error: `Sesi WAHA '${session}' belum terhubung ke WhatsApp. Status: ${sess?.status || 'STOPPED'}`,
    });
  }

  try {
    const recipientJid = toJid(chatId);
    const sent = await sess.sock.sendMessage(recipientJid, { text });

    console.log(`[WAHA] 📤 Message sent to ${recipientJid}: "${text.substring(0, 40)}"`);

    res.json({
      id: sent?.key?.id || `msg_${Date.now()}`,
      timestamp: sent?.messageTimestamp || Math.floor(Date.now() / 1000),
      fromMe: true,
      to: recipientJid,
      text,
      status: 'SENT',
    });
  } catch (err) {
    console.error('[WAHA Send Error]:', err);
    res.status(500).json({ error: err.message || 'Gagal mengirim pesan via WhatsApp.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 WAHA (WhatsApp HTTP API) Gateway Server Online`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📖 Endpoint REST API:`);
  console.log(`   - GET  http://localhost:${PORT}/api/sessions/default`);
  console.log(`   - GET  http://localhost:${PORT}/api/default/auth/qr`);
  console.log(`   - POST http://localhost:${PORT}/api/sendText`);
  console.log(`========================================================\n`);

  // Auto start default session
  initSession('default');
});
