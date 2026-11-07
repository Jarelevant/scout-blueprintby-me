import React from 'react';
import {
  Search,
  Database,
  ArrowUpRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Prospect } from '../../types';

export const DashboardView: React.FC = () => {
  const { stats, jobs, prospects, activities, setCurrentTab, setSelectedProspect } = useApp();

  const handleOpenProspect = (p: Prospect) => {
    setSelectedProspect(p);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Scraped
          </span>
        );
      case 'pending':
      case 'running':
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#70757D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
            Discovery Overview
          </h2>
          <p className="text-sm text-[#70757D] mt-1">
            Real-time prospect discovery activity, website scraping status, and pipeline metrics.
          </p>
        </div>

        {/* Quick Actions (Two simple actions as requested) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('search')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Find New Prospects</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('prospects')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#202124] bg-white hover:bg-[#F8F9FA] border border-[#E9EAEC] rounded-lg transition-colors"
          >
            <Database className="w-4 h-4 text-[#70757D]" />
            <span>View All Prospects</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics: Four compact summary metrics with subtle separators */}
      <div className="bg-white border border-[#E9EAEC] rounded-xl grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E9EAEC]">
        {/* Metric 1 */}
        <div className="p-5 sm:p-6">
          <div className="text-xs font-medium text-[#70757D] uppercase tracking-wider">
            Total Prospects
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#202124]">
            {stats.totalProspects}
          </div>
          <div className="mt-1 text-xs text-[#70757D]">
            Active in database
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 sm:p-6">
          <div className="text-xs font-medium text-[#70757D] uppercase tracking-wider">
            Successfully Scraped
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600">
            {stats.successfullyScraped}
          </div>
          <div className="mt-1 text-xs text-[#70757D]">
            Intelligence extracted
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 sm:p-6">
          <div className="text-xs font-medium text-[#70757D] uppercase tracking-wider">
            New Prospects
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#2563EB]">
            {stats.newProspects}
          </div>
          <div className="mt-1 text-xs text-[#70757D]">
            Discovered this week
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 sm:p-6">
          <div className="text-xs font-medium text-[#70757D] uppercase tracking-wider">
            Failed Scrapes
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600">
            {stats.failedScrapes}
          </div>
          <div className="mt-1 text-xs text-[#70757D]">
            Requires re-crawl
          </div>
        </div>
      </div>

      {/* Grid: Recent Discovery Activity & Chronological Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Recent Discovery Jobs Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#202124]">
              Recent Discovery Activity
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('search')}
              className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
            >
              Search more <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-[#E9EAEC] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E9EAEC] bg-[#F8F9FA] text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4">Job Name</th>
                    <th scope="col" className="py-3 px-4">Keyword</th>
                    <th scope="col" className="py-3 px-4">Location</th>
                    <th scope="col" className="py-3 px-4 text-right">Discovered</th>
                    <th scope="col" className="py-3 px-4 text-right">Scraped</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EAEC]">
                  {jobs.slice(0, 4).map((job) => (
                    <tr key={job.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#202124] whitespace-nowrap">
                        {job.name}
                      </td>
                      <td className="py-3 px-4 text-[#70757D] max-w-[160px] truncate">
                        "{job.keyword}"
                      </td>
                      <td className="py-3 px-4 text-[#70757D] whitespace-nowrap">
                        {job.location}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">
                        {job.discoveredCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 font-medium">
                        {job.scrapedCount}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[#70757D] font-mono tabular-nums whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[#70757D]">
                        No discovery jobs executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Recent Chronological Activity List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#202124]">
              Recent Activity
            </h3>
            <span className="text-xs text-[#70757D] font-mono tabular-nums">
              {activities.length} events
            </span>
          </div>

          <div className="bg-white border border-[#E9EAEC] rounded-xl p-4 shadow-xs">
            <div className="space-y-4">
              {activities.slice(0, 5).map((act, index) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {act.type === 'search_completed' && (
                      <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                        <Search className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {act.type === 'website_scraped' && (
                      <div className="w-6 h-6 rounded-md bg-[#ECFDF5] text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {act.type === 'prospect_saved' && (
                      <div className="w-6 h-6 rounded-md bg-[#F1F5F9] text-[#202124] flex items-center justify-center">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {act.type === 'scraping_failed' && (
                      <div className="w-6 h-6 rounded-md bg-[#FEF2F2] text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#202124] truncate">
                      {act.title}
                    </div>
                    <div className="text-[#70757D] text-[11px] leading-relaxed mt-0.5">
                      {act.description}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono tabular-nums mt-1">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="py-6 text-center text-xs text-[#70757D]">
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recently Discovered Companies Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#202124]">
              Recently Discovered Companies
            </h3>
            <p className="text-xs text-[#70757D] mt-0.5">
              Latest prospects gathered from web crawling and directory aggregators.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('prospects')}
            className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
          >
            View all {prospects.length} prospects <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E9EAEC] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E9EAEC] bg-[#F8F9FA] text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Company</th>
                  <th scope="col" className="py-3 px-4">Industry</th>
                  <th scope="col" className="py-3 px-4">Location</th>
                  <th scope="col" className="py-3 px-4">Website</th>
                  <th scope="col" className="py-3 px-4">Discovery Date</th>
                  <th scope="col" className="py-3 px-4">Scraping Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EAEC]">
                {prospects.slice(0, 5).map((company) => (
                  <tr key={company.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#202124]">
                      <button
                        type="button"
                        onClick={() => handleOpenProspect(company)}
                        className="hover:text-[#2563EB] transition-colors text-left"
                      >
                        {company.companyName}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-[#70757D] text-xs">
                      {company.industry}
                    </td>
                    <td className="py-3.5 px-4 text-[#70757D] text-xs whitespace-nowrap">
                      {company.location}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                      >
                        {company.website.replace('https://', '')}
                        <ExternalLink className="w-3 h-3 text-[#70757D]" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#70757D] font-mono tabular-nums whitespace-nowrap">
                      {new Date(company.discoveredDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(company.scrapingStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenProspect(company)}
                        className="px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F1F5F9] border border-[#E9EAEC] rounded-md transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {prospects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-[#70757D]">
                      No prospects discovered yet. Start by finding new prospects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
