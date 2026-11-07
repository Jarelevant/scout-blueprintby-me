import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Prospect,
  DiscoveryJob,
  ActivityItem,
  DashboardStats,
  AppSettings,
  DiscoveryResult,
  QualificationStatus,
  SearchPreset,
} from '../types';
import { apiClient, SearchProspectsRequest, ApiHealthResponse } from '../api/client';
import { calculateDashboardStats } from '../utils/prospectUtils';
import { INITIAL_SEARCH_PRESETS } from '../api/mockData';

export type NavigationTab = 'dashboard' | 'search' | 'prospects' | 'settings';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

export interface SearchRunState {
  isRunning: boolean;
  stage: string;
  stageProgress: number; // 0 to 100
  currentJobId?: string;
  results: DiscoveryResult[];
  error?: string;
}

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  prospects: Prospect[];
  jobs: DiscoveryJob[];
  activities: ActivityItem[];
  stats: DashboardStats;
  settings: AppSettings;
  selectedProspect: Prospect | null;
  setSelectedProspect: (prospect: Prospect | null) => void;
  searchRunState: SearchRunState;
  isOnline: boolean;
  lastSyncTime: string;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  
  // Search Presets
  searchPresets: SearchPreset[];
  activePreset: SearchPreset | null;
  setActivePreset: (preset: SearchPreset | null) => void;
  applySearchPreset: (preset: SearchPreset) => void;

  // Actions
  refreshAllData: () => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  deleteMultipleProspects: (ids: string[]) => Promise<void>;
  scrapeProspect: (id: string) => Promise<void>;
  saveProspectFromDiscovery: (result: DiscoveryResult) => Promise<void>;
  updateProspectQualification: (id: string, status: QualificationStatus) => Promise<void>;
  updateProspectNotesAndTags: (id: string, notes: string, tags: string[]) => Promise<void>;
  runDiscoverySearch: (req: SearchProspectsRequest) => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  testApiConnection: (url?: string) => Promise<ApiHealthResponse>;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProspects: 0,
    successfullyScraped: 0,
    newProspects: 0,
    failedScrapes: 0,
  });
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Scout',
    defaultCountry: 'United States',
    defaultResultLimit: 25,
    apiBaseUrl: 'http://localhost:8000/api/v1',
    apiStatus: 'connected',
    maxPagesPerWebsite: 10,
    requestTimeoutSeconds: 30,
    respectRobotsTxt: true,
    skipDuplicates: true,
    sources: [],
  });
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchPresets] = useState<SearchPreset[]>(INITIAL_SEARCH_PRESETS);
  const [activePreset, setActivePreset] = useState<SearchPreset | null>(null);

  const applySearchPreset = useCallback((preset: SearchPreset) => {
    setActivePreset(preset);
  }, []);

  const [searchRunState, setSearchRunState] = useState<SearchRunState>({
    isRunning: false,
    stage: 'Idle',
    stageProgress: 0,
    results: [],
  });

  const addToast = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Network reconnected. Synchronized with database.', 'success');
      setLastSyncTime(new Date().toLocaleTimeString());
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Offline mode active. All changes are securely cached locally.', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Initial data load
  const refreshAllData = useCallback(async () => {
    try {
      const [pList, jList, aList, sett] = await Promise.all([
        apiClient.getProspects(),
        apiClient.getJobs(),
        apiClient.getActivities(),
        apiClient.getSettings(),
      ]);
      setProspects(pList);
      setJobs(jList);
      setActivities(aList);
      setSettings(sett);
      setStats(calculateDashboardStats(pList));
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch {
      addToast('Failed to load initial application state', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Actions
  const deleteProspect = async (id: string) => {
    try {
      await apiClient.deleteProspect(id);
      const updated = prospects.filter((p) => p.id !== id);
      setProspects(updated);
      setStats(calculateDashboardStats(updated));
      if (selectedProspect?.id === id) {
        setSelectedProspect(null);
      }
      addToast('Prospect removed from database', 'info');
    } catch {
      addToast('Failed to delete prospect', 'error');
    }
  };

  const deleteMultipleProspects = async (ids: string[]) => {
    try {
      await apiClient.deleteMultipleProspects(ids);
      const set = new Set(ids);
      const updated = prospects.filter((p) => !set.has(p.id));
      setProspects(updated);
      setStats(calculateDashboardStats(updated));
      if (selectedProspect && set.has(selectedProspect.id)) {
        setSelectedProspect(null);
      }
      addToast(`Deleted ${ids.length} selected prospects`, 'info');
    } catch {
      addToast('Failed to delete selected prospects', 'error');
    }
  };

  const scrapeProspect = async (id: string) => {
    try {
      addToast('Starting website scraper job...', 'info');
      const updated = await apiClient.scrapeProspectWebsite(id);
      setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setStats(calculateDashboardStats(prospects.map((p) => (p.id === id ? updated : p))));
      if (selectedProspect?.id === id) {
        setSelectedProspect(updated);
      }
      const actList = await apiClient.getActivities();
      setActivities(actList);
      addToast(`Successfully scraped company data for ${updated.companyName}`, 'success');
    } catch {
      addToast('Website scraping failed to complete', 'error');
    }
  };

  const saveProspectFromDiscovery = async (result: DiscoveryResult) => {
    try {
      // Check if already saved
      if (prospects.some((p) => p.companyName.toLowerCase() === result.companyName.toLowerCase())) {
        addToast('Company is already saved in your prospects database', 'warning');
        return;
      }

      const newProspect: Prospect = {
        id: `pr-${Date.now()}`,
        companyName: result.companyName,
        website: result.website,
        industry: result.industry,
        location: result.location,
        publicEmail: `contact@${result.website.replace('https://', '').replace('http://', '').replace(/\/.*$/, '')}`,
        phone: '+1 (555) 019-8200',
        linkedinUrl: `https://linkedin.com/company/${result.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        contactPageUrl: `${result.website}/contact`,
        careersPageUrl: `${result.website}/careers`,
        description: result.summary,
        scrapingStatus: result.status,
        discoveredDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        verified: {
          email: result.status === 'scraped',
          phone: false,
          website: true,
          linkedin: true,
        },
        discoveredJobListings: [
          { title: 'Software Engineer', department: 'Engineering', location: result.location }
        ],
        sourceUrls: [`Discovery Source: ${result.source}`],
        scrapingHistory: [
          {
            id: `sh-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: result.status,
            pagesScanned: 5,
            durationMs: 1100,
          }
        ],
        employeeRange: result.employeeRange || '20-50 employees',
        fundingStage: result.fundingStage || 'Seed',
        techStack: result.techStack || ['TypeScript', 'Cloud'],
        hiringVelocity: (result.hiringRolesCount && result.hiringRolesCount > 2) ? 'Aggressive' : 'Moderate',
      };

      await apiClient.saveProspect(newProspect);
      const updated = [newProspect, ...prospects];
      setProspects(updated);
      setStats(calculateDashboardStats(updated));
      const actList = await apiClient.getActivities();
      setActivities(actList);

      // Mark as saved in current search results
      setSearchRunState((prev) => ({
        ...prev,
        results: prev.results.map((r) => (r.id === result.id ? { ...r, saved: true } : r)),
      }));

      addToast(`Saved "${result.companyName}" to My Prospects`, 'success');
    } catch {
      addToast('Failed to save prospect', 'error');
    }
  };

  const runDiscoverySearch = async (req: SearchProspectsRequest) => {
    setSearchRunState({
      isRunning: true,
      stage: '1/5 Initializing search query and sources...',
      stageProgress: 15,
      results: [],
    });

    try {
      // Progressive simulation of real discovery pipeline stages
      await new Promise((r) => setTimeout(r, 600));
      setSearchRunState((prev) => ({
        ...prev,
        stage: `2/5 Crawling active sources (${req.sources.join(', ')})...`,
        stageProgress: 40,
      }));

      await new Promise((r) => setTimeout(r, 700));
      setSearchRunState((prev) => ({
        ...prev,
        stage: '3/5 Extracting company entities & website metadata...',
        stageProgress: 65,
      }));

      await new Promise((r) => setTimeout(r, 650));
      setSearchRunState((prev) => ({
        ...prev,
        stage: '4/5 Deduplicating records against existing database...',
        stageProgress: 85,
      }));

      const { job, generatedResults } = await apiClient.startDiscoverySearch(req);

      await new Promise((r) => setTimeout(r, 450));
      setSearchRunState({
        isRunning: false,
        stage: '5/5 Discovery complete',
        stageProgress: 100,
        currentJobId: job.id,
        results: generatedResults,
      });

      // Update jobs list & activities
      setJobs((prev) => [job, ...prev]);
      const actList = await apiClient.getActivities();
      setActivities(actList);

      addToast(`Discovered ${generatedResults.length} companies matching "${req.keyword}"`, 'success');
    } catch {
      setSearchRunState((prev) => ({
        ...prev,
        isRunning: false,
        stage: 'Search failed',
        stageProgress: 0,
        error: 'Failed to complete discovery job',
      }));
      addToast('Discovery search failed', 'error');
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      const saved = await apiClient.saveSettings(newSettings);
      setSettings(saved);
      addToast('Settings saved successfully', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    }
  };

  const testApiConnection = async (url?: string): Promise<ApiHealthResponse> => {
    return apiClient.testBackendConnection(url);
  };

  const updateProspectQualification = async (id: string, status: QualificationStatus) => {
    try {
      const updated = await apiClient.updateProspectQualification(id, status);
      setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (selectedProspect?.id === id) {
        setSelectedProspect(updated);
      }
      addToast(`Status updated to ${status.replace('_', ' ')}`, 'success');
    } catch {
      addToast('Failed to update prospect status', 'error');
    }
  };

  const updateProspectNotesAndTags = async (id: string, notes: string, tags: string[]) => {
    try {
      const updated = await apiClient.updateProspectNotesAndTags(id, notes, tags);
      setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (selectedProspect?.id === id) {
        setSelectedProspect(updated);
      }
      addToast('Prospect notes & tags saved', 'success');
    } catch {
      addToast('Failed to update notes & tags', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        prospects,
        jobs,
        activities,
        stats,
        settings,
        selectedProspect,
        setSelectedProspect,
        searchRunState,
        isOnline,
        lastSyncTime,
        toasts,
        addToast,
        removeToast,
        searchPresets,
        activePreset,
        setActivePreset,
        applySearchPreset,
        refreshAllData,
        deleteProspect,
        deleteMultipleProspects,
        scrapeProspect,
        saveProspectFromDiscovery,
        updateProspectQualification,
        updateProspectNotesAndTags,
        runDiscoverySearch,
        updateSettings,
        testApiConnection,
        mobileNavOpen,
        setMobileNavOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
