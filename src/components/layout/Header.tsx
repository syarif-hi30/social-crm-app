import React, { useState } from 'react';
import {
  Bell,
  RefreshCw,
  Search,
  Database,
  MessageCircle,
  Instagram,
  Video,
  Facebook,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Platform } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUser,
    refreshDataFromSupabase,
    isLoadingData,
    notifications,
    markNotificationAsRead,
    selectedPlatformFilter,
    setSelectedPlatformFilter,
    supabaseConfig,
    setIsSupabaseModalOpen,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const platformIcons: { [key in Platform]: { icon: any; color: string; bg: string; label: string } } = {
    whatsapp: { icon: MessageCircle, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10 hover:text-emerald-400', label: 'WhatsApp' },
    instagram: { icon: Instagram, color: 'text-pink-400', bg: 'hover:bg-pink-500/10 hover:text-pink-400', label: 'Instagram' },
    tiktok: { icon: Video, color: 'text-rose-400', bg: 'hover:bg-rose-500/10 hover:text-rose-400', label: 'TikTok' },
    facebook: { icon: Facebook, color: 'text-blue-400', bg: 'hover:bg-blue-500/10 hover:text-blue-400', label: 'Facebook' },
    gmail: { icon: Mail, color: 'text-red-400', bg: 'hover:bg-red-500/10 hover:text-red-400', label: 'Gmail' },
    telegram: { icon: MessageCircle, color: 'text-cyan-400', bg: 'hover:bg-cyan-500/10 hover:text-cyan-400', label: 'Telegram' },
  };

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Search & Platform Filter Quick Selector */}
      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pelanggan, nomor HP, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedPlatformFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              selectedPlatformFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          {(Object.keys(platformIcons) as Platform[]).map((plt) => {
            const item = platformIcons[plt];
            const Icon = item.icon;
            const isSelected = selectedPlatformFilter === plt;
            return (
              <button
                key={plt}
                onClick={() => setSelectedPlatformFilter(plt)}
                title={item.label}
                className={`p-1.5 rounded-md transition-all ${
                  isSelected ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 ' + item.bg
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? item.color : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls & Supabase Connection Status */}
      <div className="flex items-center gap-3">
        
        {/* Supabase Status Button */}
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            supabaseConfig.isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{supabaseConfig.isConfigured ? 'Supabase Live' : 'Set Supabase DB'}</span>
          {supabaseConfig.isConfigured ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Sync / Refresh Button */}
        <button
          onClick={refreshDataFromSupabase}
          disabled={isLoadingData}
          title="Sinkronisasi Data Realtime dari Supabase"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoadingData ? 'animate-spin' : ''}`} />
          <span>{isLoadingData ? 'Memuat...' : 'Refresh'}</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Notifikasi Real-Time</span>
                <span className="text-[10px] text-slate-500 font-mono">Live Postgres Stream</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">Tidak ada notifikasi baru</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 text-xs hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{notif.title}</span>
                        <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{notif.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-indigo-400 font-medium">{currentUser.role.toUpperCase()}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
