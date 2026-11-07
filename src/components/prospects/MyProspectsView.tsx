import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Phone,
  Linkedin,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Prospect, SortField, SortOrder, ProspectFilters } from '../../types';
import { filterProspects, sortProspects, generateProspectsCsv } from '../../utils/prospectUtils';

export const MyProspectsView: React.FC = () => {
  const {
    prospects,
    setSelectedProspect,
    deleteProspect,
    deleteMultipleProspects,
    scrapeProspect,
    addToast,
    setCurrentTab,
  } = useApp();

  // Filters state
  const [filters, setFilters] = useState<ProspectFilters>({
    searchQuery: '',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
    qualificationStatus: 'all',
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('discoveredDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Extract unique industries & locations for dropdown filters
  const uniqueIndustries = useMemo(() => {
    const set = new Set(prospects.map((p) => p.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [prospects]);

  const uniqueLocations = useMemo(() => {
    const set = new Set(prospects.map((p) => p.location).filter(Boolean));
    return Array.from(set).sort();
  }, [prospects]);

  const qualificationCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: prospects.length,
      qualified: 0,
      under_review: 0,
      contacted: 0,
      discovered: 0,
      disqualified: 0,
    };
    prospects.forEach((p) => {
      const q = p.qualificationStatus || 'discovered';
      if (counts[q] !== undefined) {
        counts[q]++;
      }
    });
    return counts;
  }, [prospects]);

  // Apply filtering and sorting
  const filteredProspects = useMemo(() => {
    const list = filterProspects(prospects, filters);
    return sortProspects(list, sortField, sortOrder);
  }, [prospects, filters, sortField, sortOrder]);

  // Paginated slice
  const totalPages = Math.ceil(filteredProspects.length / pageSize) || 1;
  const paginatedProspects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProspects.slice(start, start + pageSize);
  }, [filteredProspects, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle Multi-select
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProspects.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export Action
  const handleExportCsv = () => {
    const exportData =
      selectedIds.length > 0
        ? prospects.filter((p) => selectedIds.includes(p.id))
        : filteredProspects;

    if (exportData.length === 0) {
      addToast('No prospects available to export', 'warning');
      return;
    }

    const csvContent = generateProspectsCsv(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `blueprint_prospects_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Exported ${exportData.length} prospects to CSV`, 'success');
  };

  // Batch Delete Action
  const handleConfirmBatchDelete = async () => {
    await deleteMultipleProspects(selectedIds);
    setSelectedIds([]);
    setShowBatchDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
            My Prospects
          </h2>
          <p className="text-sm text-[#70757D] mt-1">
            Searchable internal database of discovered businesses, verified emails, and web intelligence.
          </p>
        </div>

        {/* Global actions: CSV Export & Find More */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#202124] bg-white hover:bg-[#F8F9FA] border border-[#E9EAEC] rounded-lg transition-colors shadow-xs"
            title="Download CSV of current selection or filtered table"
          >
            <Download className="w-4 h-4 text-[#70757D]" />
            <span>Export CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('search')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-xs"
          >
            <span>+ Find Prospects</span>
          </button>
        </div>
      </div>

      {/* Qualification Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E9EAEC]">
        {[
          { key: 'all', label: 'All Prospects' },
          { key: 'qualified', label: 'Qualified' },
          { key: 'under_review', label: 'Under Review' },
          { key: 'contacted', label: 'Contacted' },
          { key: 'discovered', label: 'Discovered' },
          { key: 'disqualified', label: 'Disqualified' },
        ].map((tab) => {
          const count = qualificationCounts[tab.key] || 0;
          const isActive = (filters.qualificationStatus || 'all') === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilters({ ...filters, qualificationStatus: tab.key as any });
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-[#202124] text-white shadow-xs'
                  : 'text-[#70757D] hover:text-[#202124] hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-[#70757D]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E9EAEC] rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Search Query */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters({ ...filters, searchQuery: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Search company, website, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#202124]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Industry Filter */}
          <div>
            <select
              value={filters.industry}
              onChange={(e) => {
                setFilters({ ...filters, industry: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="all">All Industries</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* 3. Location Filter */}
          <div>
            <select
              value={filters.location}
              onChange={(e) => {
                setFilters({ ...filters, location: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* 4. Funding Stage Filter */}
          <div>
            <select
              value={filters.fundingStage || 'all'}
              onChange={(e) => {
                setFilters({ ...filters, fundingStage: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="all">All Funding Stages</option>
              <option value="Bootstrapped">Bootstrapped</option>
              <option value="Seed">Seed</option>
              <option value="Series A-B">Series A-B</option>
              <option value="Growth / Series C+">Growth / Series C+</option>
              <option value="Public">Public</option>
            </select>
          </div>

          {/* 5. Scraping Status Filter */}
          <div>
            <select
              value={filters.scrapingStatus}
              onChange={(e) => {
                setFilters({ ...filters, scrapingStatus: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="scraped">Scraped (Verified)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Active selection summary banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
            <span className="text-[#1E40AF] font-medium">
              {selectedIds.length} {selectedIds.length === 1 ? 'prospect' : 'prospects'} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-2.5 py-1 text-xs font-medium text-[#1E40AF] hover:bg-[#DBEAFE] rounded transition-colors"
              >
                Export Selected
              </button>
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 rounded transition-colors inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[#1E40AF] hover:text-[#1E3A8A] ml-2"
                aria-label="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Prospects Data Table */}
      <div className="bg-white border border-[#E9EAEC] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9EAEC] bg-[#F8F9FA] text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProspects.length > 0 &&
                      paginatedProspects.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={handleSelectAllOnPage}
                    className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                    aria-label="Select all on this page"
                  />
                </th>
                <th scope="col" className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('companyName')}
                    className="flex items-center gap-1 hover:text-[#202124] uppercase text-[11px] font-semibold"
                  >
                    <span>Company Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4">Website</th>
                <th scope="col" className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('industry')}
                    className="flex items-center gap-1 hover:text-[#202124] uppercase text-[11px] font-semibold"
                  >
                    <span>Industry</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 hover:text-[#202124] uppercase text-[11px] font-semibold"
                  >
                    <span>Location</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4">Public Email</th>
                <th scope="col" className="py-3 px-4">Phone</th>
                <th scope="col" className="py-3 px-4">LinkedIn</th>
                <th scope="col" className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('scrapingStatus')}
                    className="flex items-center gap-1 hover:text-[#202124] uppercase text-[11px] font-semibold"
                  >
                    <span>Scraping Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4">
                  <span className="uppercase text-[11px] font-semibold">Qualification</span>
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('discoveredDate')}
                    className="inline-flex items-center gap-1 hover:text-[#202124] uppercase text-[11px] font-semibold"
                  >
                    <span>Discovered</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EAEC]">
              {paginatedProspects.map((prospect) => {
                const isChecked = selectedIds.includes(prospect.id);
                return (
                  <tr
                    key={prospect.id}
                    className={`hover:bg-[#F8F9FA]/70 transition-colors ${
                      isChecked ? 'bg-[#EFF6FF]/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(prospect.id)}
                        className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                        aria-label={`Select ${prospect.companyName}`}
                      />
                    </td>

                    {/* Company Name */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProspect(prospect)}
                        className="font-semibold text-[#202124] hover:text-[#2563EB] transition-colors text-left truncate max-w-[200px]"
                      >
                        {prospect.companyName}
                      </button>
                    </td>

                    {/* Website */}
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#2563EB] hover:underline inline-flex items-center gap-1 truncate max-w-[150px]"
                      >
                        {prospect.website.replace('https://', '')}
                        <ExternalLink className="w-3 h-3 text-[#70757D]" />
                      </a>
                    </td>

                    {/* Industry */}
                    <td className="py-3.5 px-4 text-xs text-[#70757D] whitespace-nowrap">
                      {prospect.industry}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-xs text-[#70757D] whitespace-nowrap">
                      {prospect.location}
                    </td>

                    {/* Public Email */}
                    <td className="py-3.5 px-4 text-xs">
                      {prospect.publicEmail ? (
                        <div className="flex items-center gap-1.5 font-mono text-[#202124]">
                          <span className="truncate max-w-[140px]">{prospect.publicEmail}</span>
                          {prospect.verified.email && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" title="Verified public email" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF] italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-xs font-mono text-[#70757D] whitespace-nowrap">
                      {prospect.phone || '—'}
                    </td>

                    {/* LinkedIn */}
                    <td className="py-3.5 px-4 text-xs">
                      {prospect.linkedinUrl ? (
                        <a
                          href={prospect.linkedinUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF] text-[11px]">—</span>
                      )}
                    </td>

                    {/* Scraping Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {prospect.scrapingStatus === 'scraped' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Scraped
                        </span>
                      )}
                      {prospect.scrapingStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Pending
                        </span>
                      )}
                      {prospect.scrapingStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>

                    {/* Qualification Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {prospect.qualificationStatus === 'qualified' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Qualified
                        </span>
                      )}
                      {prospect.qualificationStatus === 'under_review' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Under Review
                        </span>
                      )}
                      {prospect.qualificationStatus === 'contacted' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-[#2563EB] border border-blue-200">
                          Contacted
                        </span>
                      )}
                      {prospect.qualificationStatus === 'disqualified' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          Disqualified
                        </span>
                      )}
                      {(!prospect.qualificationStatus || prospect.qualificationStatus === 'discovered') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          Discovered
                        </span>
                      )}
                    </td>

                    {/* Discovered Date */}
                    <td className="py-3.5 px-4 text-right text-xs text-[#70757D] font-mono tabular-nums whitespace-nowrap">
                      {new Date(prospect.discoveredDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProspect(prospect)}
                          className="px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F1F5F9] border border-[#E9EAEC] rounded-md transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => scrapeProspect(prospect.id)}
                          title="Scrape company website"
                          className="p-1 rounded text-[#70757D] hover:text-[#2563EB] hover:bg-[#F1F5F9] transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedProspects.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-[#70757D]">
                    <div className="space-y-1">
                      <p className="font-semibold text-[#202124]">No matching prospects found</p>
                      <p className="text-xs">Adjust your search keyword or clear active filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-3.5 border-t border-[#E9EAEC] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#70757D]">
          <div>
            Showing <strong className="text-[#202124] font-mono">{filteredProspects.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-[#202124] font-mono">
              {Math.min(currentPage * pageSize, filteredProspects.length)}
            </strong> of{' '}
            <strong className="text-[#202124] font-mono">{filteredProspects.length}</strong> prospects
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#E9EAEC] bg-white text-[#202124] hover:bg-[#F8F9FA] disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white text-[#70757D] hover:bg-[#F8F9FA] border border-[#E9EAEC]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-[#E9EAEC] bg-white text-[#202124] hover:bg-[#F8F9FA] disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Batch Delete */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowBatchDeleteModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E9EAEC]">
            <h3 className="text-lg font-bold text-[#202124]">
              Confirm Batch Deletion
            </h3>
            <p className="text-sm text-[#70757D] mt-2">
              Are you sure you want to permanently delete {selectedIds.length} selected{' '}
              {selectedIds.length === 1 ? 'prospect' : 'prospects'} from your database? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#70757D] hover:bg-[#F8F9FA] border border-[#E9EAEC] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
