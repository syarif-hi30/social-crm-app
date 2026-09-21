import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { OmniChannelInbox } from './components/inbox/OmniChannelInbox';
import { ContactManager } from './components/contacts/ContactManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CloudSyncManager } from './components/sync/CloudSyncManager';
import { SecurityVault } from './components/security/SecurityVault';
import { ApiIntegrationHub } from './components/integrations/ApiIntegrationHub';
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden bg-slate-900 flex flex-col">
        {activeTab === 'dashboard' && <AnalyticsDashboard />}
        {activeTab === 'inbox' && <OmniChannelInbox />}
        {activeTab === 'contacts' && <ContactManager />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'sync' && <CloudSyncManager />}
        {activeTab === 'security' && <SecurityVault />}
        {activeTab === 'integrations' && <ApiIntegrationHub />}
      </main>
      <SupabaseConfigModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  );
}

export default App;
