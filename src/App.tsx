import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { SearchProspectsView } from './components/search/SearchProspectsView';
import { MyProspectsView } from './components/prospects/MyProspectsView';
import { SettingsView } from './components/settings/SettingsView';
import { ProspectDetailModal } from './components/prospects/ProspectDetailModal';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthGate } from './components/auth/AuthGate';

const MainLayout: React.FC = () => {
  const { currentTab, setCurrentTab, selectedProspect, setSelectedProspect } = useApp();

  // Keyboard shortcut: Cmd+K or Ctrl+K opens Search Prospects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentTab('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTab]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#202124] flex">
      {/* Sidebar (Desktop fixed, mobile drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'search' && <SearchProspectsView />}
          {currentTab === 'prospects' && <MyProspectsView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Detailed Prospect Modal / Drawer */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthGate>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthGate>
  );
}
