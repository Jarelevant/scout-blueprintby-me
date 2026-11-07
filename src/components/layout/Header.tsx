import React, { useState } from 'react';
import {
  Menu,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  Search as SearchIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { currentTab, setMobileNavOpen, activities, isOnline, lastSyncTime, setCurrentTab } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          breadcrumb: 'Overview',
          description: 'Prospect discovery activity, scraping status, and pipeline metrics.',
        };
      case 'search':
        return {
          title: 'Search Prospects',
          breadcrumb: 'Discovery',
          description: 'Multi-source discovery engine across web, directories, and business registries.',
        };
      case 'prospects':
        return {
          title: 'My Prospects',
          breadcrumb: 'Database',
          description: 'Searchable database of discovered companies, verified contacts, and scraping records.',
        };
      case 'settings':
        return {
          title: 'Settings',
          breadcrumb: 'System',
          description: 'Configure discovery sources, scraping policies, and FastAPI backend integration.',
        };
      default:
        return { title: 'Dashboard', breadcrumb: 'Overview', description: '' };
    }
  };

  const info = getPageInfo();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-[#E9EAEC]">
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 gap-4">
        {/* Left Zone: Mobile Toggle + Breadcrumb & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#70757D] hover:bg-[#F8F9FA] transition-colors -ml-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#70757D]">
              <span>Blueprint</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#202124] font-medium">{info.breadcrumb}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#202124] tracking-tight truncate">
              {info.title}
            </h1>
          </div>
        </div>

        {/* Right Zone: Action affordances */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick jump to search if not already on search */}
          {currentTab !== 'search' && (
            <button
              type="button"
              onClick={() => setCurrentTab('search')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-[#70757D] bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E9EAEC] rounded-lg transition-colors"
            >
              <SearchIcon className="w-3.5 h-3.5 text-[#70757D]" />
              <span>Find new prospects...</span>
              <kbd className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E9EAEC]">⌘K</kbd>
            </button>
          )}

          {/* Sync indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#70757D] bg-[#F8F9FA] rounded-md border border-[#E9EAEC]">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
              title={isOnline ? 'Synced' : 'Offline'}
            />
            <span className="font-mono text-[11px] tabular-nums">Sync: {lastSyncTime}</span>
          </div>

          {/* Notifications Flyout Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-[#70757D] hover:text-[#202124] hover:bg-[#F8F9FA] border border-[#E9EAEC] transition-colors relative"
              aria-label="Toggle notifications panel"
            >
              <Bell className="w-4 h-4" />
              {activities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-[#E9EAEC] z-40 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E9EAEC]">
                    <div className="text-sm font-semibold text-[#202124]">Activity Log</div>
                    <span className="text-xs text-[#70757D]">Recent updates</span>
                  </div>
                  <div className="divide-y divide-[#E9EAEC] max-h-72 overflow-y-auto mt-1">
                    {activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="py-2.5 text-xs">
                        <div className="font-medium text-[#202124] flex items-center justify-between">
                          <span>{act.title}</span>
                          <span className="text-[11px] text-[#70757D] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#9CA3AF]" />
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[#70757D] mt-0.5">{act.description}</div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <div className="py-6 text-center text-xs text-[#70757D]">
                        No recent activity recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User profile avatar */}
          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#374151] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#E9EAEC]">
            BP
          </div>
        </div>
      </div>
    </header>
  );
};
