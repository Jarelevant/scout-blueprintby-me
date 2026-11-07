import React from 'react';
import {
  LayoutDashboard,
  Search,
  Database,
  Settings,
  X,
  Layers,
  CloudCheck,
  CloudOff,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, mobileNavOpen, setMobileNavOpen, isOnline, prospects } = useApp();

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Search Prospects', icon: Search },
    { id: 'prospects', label: 'My Prospects', icon: Database, badge: prospects.length },
  ];

  const handleNavClick = (tabId: NavigationTab) => {
    setCurrentTab(tabId);
    setMobileNavOpen(false);
  };

  const content = (
    <div className="flex h-full flex-col justify-between bg-white text-[#202124]">
      {/* Top Section: Brand & Nav */}
      <div>
        {/* Branding header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-[#E9EAEC]">
          <div className="flex items-center gap-3">
            {/* Minimalist Blueprint Architectural Icon */}
            <div className="w-9 h-9 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-semibold shadow-xs">
              <Layers className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#202124] leading-tight">
                BLUEPRINT
              </div>
              <div className="text-xs text-[#2563EB] font-semibold leading-tight tracking-wide">
                Scout
              </div>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-md text-[#70757D] hover:bg-[#F8F9FA] transition-colors"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 py-4 space-y-1" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F1F5F9] text-[#2563EB]'
                    : 'text-[#202124] hover:bg-[#F8F9FA] hover:text-[#202124]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#70757D]'}`} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono tabular-nums ${
                      isActive ? 'bg-[#E0E7FF] text-[#2563EB] font-semibold' : 'bg-[#F1F5F9] text-[#70757D]'
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

      {/* Bottom Section: Settings & Info */}
      <div className="px-3 py-4 border-t border-[#E9EAEC] space-y-3">
        {/* Settings button */}
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-[#F1F5F9] text-[#2563EB]'
              : 'text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <Settings
            className={`w-4 h-4 ${currentTab === 'settings' ? 'text-[#2563EB]' : 'text-[#70757D]'}`}
            strokeWidth={1.8}
          />
          <span>Settings</span>
        </button>

        {/* Sync Status Info */}
        <div className="px-3.5 py-2 rounded-md bg-[#F8F9FA] flex items-center justify-between text-xs text-[#70757D]">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isOnline ? 'Cloud Synced' : 'Offline Cache'}</span>
          </div>
          <span className="font-mono text-[11px] text-[#9CA3AF]">v1.1</span>
        </div>

        {/* User profile placeholder */}
        <div className="px-3.5 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#374151] font-semibold text-xs flex items-center justify-center shrink-0">
            BP
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#202124] truncate">
              Blueprint Analyst
            </div>
            <div className="text-[11px] text-[#70757D] truncate">
              internal@blueprintby.me
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-[#E9EAEC]">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};
