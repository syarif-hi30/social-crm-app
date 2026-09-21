import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Database,
  ShieldCheck,
  Webhook,
  Zap,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, contacts, supabaseConfig, setIsSupabaseModalOpen } = useApp();

  const unreadMessagesCount = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard CRM', icon: LayoutDashboard },
    {
      id: 'inbox',
      label: 'Omnichannel Inbox',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { id: 'contacts', label: 'Database Kontak & PII', icon: Users, badge: contacts.length > 0 ? contacts.length : undefined, badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'analytics', label: 'Analitik & Realtime KPI', icon: BarChart3 },
    {
      id: 'sync',
      label: 'Supabase Cloud Database',
      icon: Database,
      badge: supabaseConfig.isConfigured ? 'Connected' : 'Setup Required',
      badgeColor: supabaseConfig.isConfigured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    { id: 'security', label: 'Security & Vault (AES-256)', icon: ShieldCheck },
    { id: 'integrations', label: 'Integrasi Webhook & API', icon: Webhook },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-none">OmniCRM Cloud</h1>
            <span className="text-[10px] text-indigo-400 font-medium">Vercel & Supabase Edition</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                      item.badgeColor || 'bg-indigo-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Vault
          </span>
          <span className="text-emerald-400 font-medium text-[11px]">Aktif</span>
        </div>
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className="w-full flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
        >
          <span className="text-slate-400 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            Supabase DB
          </span>
          <span className="text-indigo-400 font-semibold text-[11px]">
            {supabaseConfig.isConfigured ? 'Connected' : 'Setup'}
          </span>
        </button>
        <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-800/60">
          Vercel Production Deployment
        </div>
      </div>
    </aside>
  );
};
