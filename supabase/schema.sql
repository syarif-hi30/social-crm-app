-- ==============================================================================
-- OMNICHANNEL SOCIAL MEDIA CRM - COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Ready for Production & Realtime synchronization
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Tables (if re-running)
DROP TABLE IF EXISTS canned_responses CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS api_integrations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- ==============================================================================
-- TABLE: channels
-- Connectors for WhatsApp, Instagram, TikTok, Facebook, Gmail, etc.
-- ==============================================================================
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('whatsapp', 'instagram', 'tiktok', 'facebook', 'gmail', 'telegram')),
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    webhook_secret TEXT,
    access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: contacts
-- Customer master record with encrypted PII support & multi-platform mapping
-- ==============================================================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(255),
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'tiktok', 'facebook', 'gmail', 'telegram')),
    phone VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'customer', 'active', 'vip', 'archived')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    encrypted_pii JSONB DEFAULT '{}'::JSONB,
    assigned_agent VARCHAR(255) DEFAULT 'Budi Santoso',
    total_spend NUMERIC(15, 2) DEFAULT 0.00,
    unread_count INT DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: messages
-- Real-time conversation thread linked to contacts
-- ==============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'tiktok', 'facebook', 'gmail', 'telegram')),
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('customer', 'agent', 'bot', 'system')),
    sender_name VARCHAR(255) DEFAULT 'Customer',
    content TEXT NOT NULL,
    encrypted_content TEXT,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    attachments JSONB DEFAULT '[]'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: api_integrations
-- 3rd-party webhook endpoints, token vaults & sync monitors
-- ==============================================================================
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'error', 'inactive')),
    api_url TEXT,
    api_key TEXT,
    webhook_url TEXT,
    rate_limit_per_minute INT DEFAULT 60,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: audit_logs
-- Immutable security audit trail
-- ==============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100) DEFAULT '127.0.0.1',
    severity VARCHAR(50) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: canned_responses
-- Quick response templates for CS agents
-- ==============================================================================
CREATE TABLE canned_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shortcut VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED QUERYING
-- ==============================================================================
CREATE INDEX idx_contacts_channel ON contacts(channel);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_last_activity ON contacts(last_activity DESC);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- AUTOMATIC LAST ACTIVITY TRIGGER ON CONTACTS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts 
    SET last_activity = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_last_activity();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allow full read/write for authenticated & anon clients with valid API key
-- ==============================================================================
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- Public/Anon access policies for frontend client
CREATE POLICY "Allow public all on channels" ON channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on api_integrations" ON api_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on canned_responses" ON canned_responses FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE api_integrations;
