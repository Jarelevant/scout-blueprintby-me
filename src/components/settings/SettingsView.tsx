import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Shield,
  Sliders,
  Server,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, testApiConnection, addToast } = useApp();

  // Local form state
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{
    status: 'healthy' | 'offline';
    latencyMs: number;
    message?: string;
  } | null>(null);

  const handleSourceToggle = (sourceId: string) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.map((s) =>
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const handleTestConnection = async () => {
    setIsTestingApi(true);
    try {
      const res = await testApiConnection(formData.apiBaseUrl);
      setApiTestResult({
        status: res.status,
        latencyMs: res.latencyMs,
        message: `FastAPI Adapter Handshake OK (${res.latencyMs}ms latency)`,
      });
      addToast(`Backend API test succeeded in ${res.latencyMs}ms`, 'success');
    } catch {
      setApiTestResult({
        status: 'offline',
        latencyMs: 0,
        message: 'Could not connect to FastAPI endpoint',
      });
      addToast('Backend API test failed', 'error');
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
          Settings & Preferences
        </h2>
        <p className="text-sm text-[#70757D] mt-1">
          Configure discovery crawler behavior, search source connectors, and Python FastAPI backend endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section A: General Settings */}
        <div className="bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E9EAEC]">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-semibold text-[#202124]">
              A. General Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="app-name-input" className="block text-xs font-semibold text-[#202124]">
                Application Name
              </label>
              <input
                id="app-name-input"
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="default-country-input" className="block text-xs font-semibold text-[#202124]">
                Default Country
              </label>
              <input
                id="default-country-input"
                type="text"
                value={formData.defaultCountry}
                onChange={(e) => setFormData({ ...formData, defaultCountry: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="default-result-limit-select" className="block text-xs font-semibold text-[#202124]">
                Default Result Limit
              </label>
              <select
                id="default-result-limit-select"
                value={formData.defaultResultLimit}
                onChange={(e) => setFormData({ ...formData, defaultResultLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              >
                <option value={10}>10 records</option>
                <option value={25}>25 records</option>
                <option value={50}>50 records</option>
                <option value={100}>100 records</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section B: Discovery Sources */}
        <div className="bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E9EAEC]">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-semibold text-[#202124]">
                B. Discovery Sources
              </h3>
            </div>
            <span className="text-xs text-[#70757D]">
              UI connectors & connector health
            </span>
          </div>

          <div className="divide-y divide-[#E9EAEC]">
            {formData.sources.map((source) => (
              <div
                key={source.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#202124]">
                      {source.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                        source.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#F1F5F9] text-[#70757D] border border-[#E9EAEC]'
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#70757D] mt-0.5">
                    {source.description}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => handleSourceToggle(source.id)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#E5E7EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: API Configuration */}
        <div className="bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E9EAEC]">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-semibold text-[#202124]">
                C. Backend API Configuration (FastAPI)
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Adapter Ready
            </span>
          </div>

          <div className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9EAEC] flex items-start gap-3 text-xs text-[#70757D]">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#202124]">
                Security Notice: Never expose real API keys or secrets in the browser bundle.
              </p>
              <p className="mt-0.5 leading-relaxed">
                The frontend connects directly to Python FastAPI endpoints using standard HTTP bearer tokens or cookies. All scraping workers run asynchronously behind job queues.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-base-url-input" className="block text-xs font-semibold text-[#202124]">
              API Base URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="api-base-url-input"
                type="text"
                value={formData.apiBaseUrl}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="http://localhost:8000/api/v1"
                className="flex-1 px-3.5 py-2 text-sm font-mono bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingApi}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#202124] bg-white hover:bg-[#F8F9FA] border border-[#E9EAEC] rounded-lg transition-colors shrink-0 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                <span>{isTestingApi ? 'Testing Handshake...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          {apiTestResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                apiTestResult.status === 'healthy'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {apiTestResult.status === 'healthy' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{apiTestResult.message}</span>
              </div>
              <span className="font-mono tabular-nums font-semibold">
                {apiTestResult.latencyMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Section D: Scraping Preferences */}
        <div className="bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E9EAEC]">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-semibold text-[#202124]">
              D. Scraping Preferences & Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="max-pages-select" className="block text-xs font-semibold text-[#202124]">
                Maximum Pages per Website
              </label>
              <select
                id="max-pages-select"
                value={formData.maxPagesPerWebsite}
                onChange={(e) => setFormData({ ...formData, maxPagesPerWebsite: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              >
                <option value={5}>5 pages (Light crawl: Home + Contact)</option>
                <option value={10}>10 pages (Standard: Home, About, Careers, Team)</option>
                <option value={25}>25 pages (Deep extraction)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="timeout-select" className="block text-xs font-semibold text-[#202124]">
                Crawler Request Timeout
              </label>
              <select
                id="timeout-select"
                value={formData.requestTimeoutSeconds}
                onChange={(e) => setFormData({ ...formData, requestTimeoutSeconds: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds (Recommended)</option>
                <option value={60}>60 seconds (Heavy sites)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-lg border border-[#E9EAEC] bg-[#FFFFFF] hover:bg-[#F8F9FA] cursor-pointer transition-colors">
              <div>
                <div className="text-xs font-semibold text-[#202124]">
                  Respect Website Crawling Policies (robots.txt)
                </div>
                <div className="text-[11px] text-[#70757D]">
                  Strictly adhere to Disallow rules and crawl-delay directives declared by target domains.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.respectRobotsTxt}
                onChange={(e) => setFormData({ ...formData, respectRobotsTxt: e.target.checked })}
                className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB] ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-[#E9EAEC] bg-[#FFFFFF] hover:bg-[#F8F9FA] cursor-pointer transition-colors">
              <div>
                <div className="text-xs font-semibold text-[#202124]">
                  Skip Duplicate Companies Automatically
                </div>
                <div className="text-[11px] text-[#70757D]">
                  Compare incoming domain hostnames against the existing prospect database before crawler dispatch.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.skipDuplicates}
                onChange={(e) => setFormData({ ...formData, skipDuplicates: e.target.checked })}
                className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB] ml-3"
              />
            </label>
          </div>
        </div>

        {/* Form Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
