import React from 'react';
import { UserCheck, Shield, Mail, Clock, CheckCircle2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeamManager: React.FC = () => {
  const { users, currentUser, setCurrentUser, contacts } = useApp();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" /> Manajemen Tim & Multi-User Berakses Bersamaan
          </h2>
          <p className="text-xs text-slate-400">
            Dukungan akses multi-agen secara bersamaan dengan pemisahan peran dan sinkronisasi status kehadiran.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((user) => {
          const assignedCount = contacts.filter((c) => c.assignedTo === user.id).length;
          const isCurrentActive = currentUser.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-slate-950 p-5 rounded-2xl border transition-all space-y-4 shadow-md ${
                isCurrentActive ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role Akses:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase border border-purple-500/20">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Kehadiran:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {user.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kontak Ditangani:</span>
                  <span className="text-slate-200 font-bold">{assignedCount} Pelanggan</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCurrentUser(user)}
                  disabled={isCurrentActive}
                  className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                    isCurrentActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                  }`}
                >
                  {isCurrentActive ? 'Sesi Aktif Saat Ini' : `Beralih Sesi sebagai ${user.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
