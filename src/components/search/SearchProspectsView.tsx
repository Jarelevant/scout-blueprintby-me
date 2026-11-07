import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookmarkCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  Coins,
  Cpu,
  Flame,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateSearchQuery } from '../../utils/prospectUtils';
import { DiscoveryResult, Prospect, SearchPreset } from '../../types';

export const SearchProspectsView: React.FC = () => {
  const {
    jobs,
    searchRunState,
    runDiscoverySearch,
    saveProspectFromDiscovery,
    setSelectedProspect,
    prospects,
    scrapeProspect,
    searchPresets,
    activePreset,
    applySearchPreset,
  } = useApp();

  // Search form fields
  const [keyword, setKeyword] = useState('Software development companies');
  const [location, setLocation] = useState('United States');
  const [category, setCategory] = useState('Software Development');
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'Brave Search',
    'Y Combinator Directory',
    'Clutch',
    'GitHub Organizations',
  ]);
  const [maxResults, setMaxResults] = useState<number>(25);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Advanced discovery parameters & intent toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [employeeRange, setEmployeeRange] = useState<string>('All Sizes');
  const [fundingStage, setFundingStage] = useState<string>('All Stages');
  const [techKeywords, setTechKeywords] = useState<string>('');
  const [hiringIntentOnly, setHiringIntentOnly] = useState<boolean>(false);
  const [minVerifiedEmail, setMinVerifiedEmail] = useState<boolean>(false);

  const availableSources = [
    {
      id: 'Brave Search',
      title: 'Brave Search',
      desc: 'Direct open-web query resolution and search index entity crawling.',
    },
    {
      id: 'Y Combinator Directory',
      title: 'Y Combinator Directory',
      desc: 'Verified fast-growing startups, seed/series-A companies, and founder profiles.',
    },
    {
      id: 'Clutch',
      title: 'Clutch',
      desc: 'B2B directories of software agencies, IT consultants, and technical service firms.',
    },
    {
      id: 'Public Business Websites',
      title: 'Public Business Websites',
      desc: 'Direct crawler targeting homepage, contact endpoints, and about sections.',
    },
    {
      id: 'Publicly Indexed Job Listings',
      title: 'Publicly Indexed Job Listings',
      desc: 'Active job openings confirming headcount growth, hiring teams, and tech stacks.',
    },
    {
      id: 'GitHub Organizations',
      title: 'GitHub Organizations',
      desc: 'Developer organization repositories, active commit velocity, and open-source packages.',
    },
    {
      id: 'Product Hunt Launch Radar',
      title: 'Product Hunt Launch Radar',
      desc: 'Newly launched digital products, SaaS tools, and fast-growing early-adopter teams.',
    },
    {
      id: 'OpenCorporates Registry',
      title: 'OpenCorporates Registry',
      desc: 'Global open corporate registry database for verified legal registrations and filings.',
    },
  ];

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((s) => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSearchQuery(keyword, location, selectedSources);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    runDiscoverySearch({
      keyword,
      location,
      category,
      sources: selectedSources,
      maxResults,
      employeeRange,
      fundingStage,
      techKeywords,
      hiringIntentOnly,
      minVerifiedEmail,
    });
  };

  const handleViewCompany = (result: DiscoveryResult) => {
    const existing = prospects.find(
      (p) => p.companyName.toLowerCase() === result.companyName.toLowerCase()
    );
    if (existing) {
      setSelectedProspect(existing);
    } else {
      const tempProspect: Prospect = {
        id: result.id,
        companyName: result.companyName,
        website: result.website,
        industry: result.industry,
        location: result.location,
        publicEmail: `contact@${result.website.replace('https://', '').replace('http://', '').replace(/\/.*$/, '')}`,
        phone: '+1 (555) 012-4099',
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
          { title: 'Senior Software Engineer', department: 'Engineering', location: result.location }
        ],
        sourceUrls: [`Source: ${result.source}`],
        scrapingHistory: [],
        employeeRange: result.employeeRange || '25-75 employees',
        fundingStage: result.fundingStage || 'Seed',
        techStack: result.techStack || ['TypeScript', 'Cloud'],
        hiringVelocity: (result.hiringRolesCount && result.hiringRolesCount > 2) ? 'Aggressive' : 'Moderate',
      };
      setSelectedProspect(tempProspect);
    }
  };

  const isSaved = (companyName: string) => {
    return prospects.some(
      (p) => p.companyName.toLowerCase() === companyName.toLowerCase()
    );
  };

  const handleLoadPreset = (preset: SearchPreset) => {
    setKeyword(preset.keyword);
    setLocation(preset.location);
    setCategory(preset.category);
    setMaxResults(preset.maxResults);
    if (preset.employeeRange) setEmployeeRange(preset.employeeRange);
    if (preset.fundingStage) setFundingStage(preset.fundingStage);
    applySearchPreset(preset);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Intro */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
          Search Prospects
        </h2>
        <p className="text-sm text-[#70757D] mt-1">
          Configure multi-source discovery queries with technographics, capital tiers, and hiring velocity filters.
        </p>
      </div>

      {/* Quick Search Presets */}
      <div className="bg-[#F8F9FA] border border-[#E9EAEC] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-semibold text-[#202124] uppercase tracking-wider">
              Saved Search Presets
            </span>
            <span className="text-xs text-[#70757D]">
              — 1-click discovery configurations
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {searchPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all text-left flex items-center gap-2 ${
                activePreset?.id === preset.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                  : 'bg-white text-[#202124] border-[#E9EAEC] hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{preset.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                  activePreset?.id === preset.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F8F9FA] text-[#70757D] border border-[#E9EAEC]'
                }`}
              >
                {preset.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Configuration Card */}
      <div className="bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-7 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* A. Search Keyword */}
            <div className="space-y-1.5 lg:col-span-1">
              <label htmlFor="search-keyword" className="block text-xs font-semibold text-[#202124]">
                Search Keyword <span className="text-rose-500">*</span>
              </label>
              <input
                id="search-keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Software development companies"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                  errors.keyword ? 'border-rose-500' : 'border-[#E9EAEC]'
                } rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors`}
              />
              {errors.keyword && (
                <p className="text-xs text-rose-600 mt-1">{errors.keyword}</p>
              )}
            </div>

            {/* B. Location */}
            <div className="space-y-1.5">
              <label htmlFor="search-location" className="block text-xs font-semibold text-[#202124]">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                id="search-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. United States or Austin, TX"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                  errors.location ? 'border-rose-500' : 'border-[#E9EAEC]'
                } rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors`}
              />
              {errors.location && (
                <p className="text-xs text-rose-600 mt-1">{errors.location}</p>
              )}
            </div>

            {/* C. Business Category */}
            <div className="space-y-1.5">
              <label htmlFor="search-category" className="block text-xs font-semibold text-[#202124]">
                Business Category
              </label>
              <select
                id="search-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              >
                <option value="Technology">Technology</option>
                <option value="Software Development">Software Development</option>
                <option value="IT Services">IT Services</option>
                <option value="Recruitment">Recruitment</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Healthcare">Healthcare</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* D. Discovery Sources (Expanded pool) */}
          <div className="space-y-2 pt-2 border-t border-[#E9EAEC]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-[#202124]">
                  Discovery Sources <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-[#70757D]">
                  Select web indices, verified startup batches, and developer repositories to crawl.
                </p>
              </div>
              <span className="text-xs text-[#70757D] font-mono">
                {selectedSources.length} of {availableSources.length} active
              </span>
            </div>
            {errors.sources && (
              <p className="text-xs text-rose-600">{errors.sources}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {availableSources.map((source) => {
                const isChecked = selectedSources.includes(source.id);
                return (
                  <label
                    key={source.id}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#2563EB] bg-[#EFF6FF]/40'
                        : 'border-[#E9EAEC] bg-[#FFFFFF] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleSourceToggle(source.id)}
                      className="mt-0.5 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#202124] leading-tight">
                        {source.title}
                      </div>
                      <div className="text-[11px] text-[#70757D] leading-snug mt-1 line-clamp-2">
                        {source.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Advanced Parameters & Intent Filters Toggle */}
          <div className="pt-2 border-t border-[#E9EAEC]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-2 text-xs font-semibold text-[#202124] hover:text-[#2563EB] transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Advanced Parameters & Intent Filters (Headcount, Technographics, Funding, Hiring)</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-[#70757D]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#70757D]" />
              )}
            </button>

            {/* Collapsible Advanced Form */}
            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-[#F8F9FA] border border-[#E9EAEC] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Headcount Range */}
                  <div className="space-y-1.5">
                    <label htmlFor="headcount-select" className="block text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#70757D]" />
                      Company Headcount
                    </label>
                    <select
                      id="headcount-select"
                      value={employeeRange}
                      onChange={(e) => setEmployeeRange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    >
                      <option value="All Sizes">All Sizes</option>
                      <option value="1-10">1-10 (Early Stage)</option>
                      <option value="11-50">11-50 (Seed / Series A)</option>
                      <option value="51-200">51-200 (Scaling Mid-Market)</option>
                      <option value="201-500">201-500 (Growth)</option>
                      <option value="500+">500+ (Enterprise)</option>
                    </select>
                  </div>

                  {/* Funding Stage */}
                  <div className="space-y-1.5">
                    <label htmlFor="funding-select" className="block text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#70757D]" />
                      Capital & Funding Stage
                    </label>
                    <select
                      id="funding-select"
                      value={fundingStage}
                      onChange={(e) => setFundingStage(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    >
                      <option value="All Stages">All Stages</option>
                      <option value="Bootstrapped">Bootstrapped / Profitable</option>
                      <option value="Seed">Pre-Seed / Seed Funded</option>
                      <option value="Series A-B">Series A-B Growth</option>
                      <option value="Growth / Series C+">Series C+ / Late Stage</option>
                      <option value="Public">Public Enterprise</option>
                    </select>
                  </div>

                  {/* Technographics / Tech Stack */}
                  <div className="space-y-1.5">
                    <label htmlFor="tech-keywords-input" className="block text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#70757D]" />
                      Target Technologies / Stack
                    </label>
                    <input
                      id="tech-keywords-input"
                      type="text"
                      value={techKeywords}
                      onChange={(e) => setTechKeywords(e.target.value)}
                      placeholder="e.g. AWS, React, Python, Stripe, Kafka"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Intent Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E9EAEC]">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E9EAEC] cursor-pointer hover:bg-[#FAFAFA] transition-colors">
                    <input
                      type="checkbox"
                      checked={hiringIntentOnly}
                      onChange={(e) => setHiringIntentOnly(e.target.checked)}
                      className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#202124] flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        Active Hiring Signal Only
                      </div>
                      <div className="text-[11px] text-[#70757D]">
                        Only target companies with active career page listings detected.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E9EAEC] cursor-pointer hover:bg-[#FAFAFA] transition-colors">
                    <input
                      type="checkbox"
                      checked={minVerifiedEmail}
                      onChange={(e) => setMinVerifiedEmail(e.target.checked)}
                      className="rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#202124]">
                        Verified Business Email Required
                      </div>
                      <div className="text-[11px] text-[#70757D]">
                        Filter out entities where contact endpoints could not be verified.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* E. Maximum Results & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-[#E9EAEC]">
            <div className="flex items-center gap-3">
              <label htmlFor="max-results" className="text-xs font-semibold text-[#202124] shrink-0">
                Maximum Results:
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-[#F8F9FA] rounded-lg border border-[#E9EAEC]">
                {[10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMaxResults(val)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors font-mono tabular-nums ${
                      maxResults === val
                        ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                        : 'text-[#70757D] hover:text-[#202124]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={searchRunState.isRunning}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {searchRunState.isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching Sources...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Prospects</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Discovery Job Progress Banner */}
      {searchRunState.isRunning && (
        <div className="bg-white border border-[#2563EB]/30 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium text-[#202124]">
              <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
              <span>{searchRunState.stage}</span>
            </div>
            <span className="font-mono tabular-nums text-[#70757D]">
              {searchRunState.stageProgress}%
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${searchRunState.stageProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-[#70757D]">
            Asynchronous multi-source crawler worker active. Normalizing entity records...
          </p>
        </div>
      )}

      {/* Discovery Notice */}
      {searchRunState.currentJobId && !searchRunState.isRunning && (
        <div className="flex items-center justify-between p-3.5 bg-[#F8F9FA] border border-[#E9EAEC] rounded-lg text-xs text-[#70757D]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>
              Discovery complete for job ID{' '}
              <strong className="text-[#202124] font-mono">{searchRunState.currentJobId}</strong>.
              All records normalized for FastAPI backend integration.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-medium">
            Status: Completed
          </span>
        </div>
      )}

      {/* Discovery Results Section with Enriched Columns */}
      {searchRunState.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#202124]">
                Discovery Results
              </h3>
              <p className="text-xs text-[#70757D] mt-0.5">
                Found {searchRunState.results.length} companies matching "{keyword}"
              </p>
            </div>
            <span className="text-xs text-[#70757D] font-mono tabular-nums">
              {searchRunState.results.filter((r) => isSaved(r.companyName)).length} saved to database
            </span>
          </div>

          <div className="bg-white border border-[#E9EAEC] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E9EAEC] bg-[#F8F9FA] text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4">Company Name</th>
                    <th scope="col" className="py-3 px-4">Website</th>
                    <th scope="col" className="py-3 px-4">Industry & Size</th>
                    <th scope="col" className="py-3 px-4">Funding Stage</th>
                    <th scope="col" className="py-3 px-4">Tech Stack</th>
                    <th scope="col" className="py-3 px-4">Source</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EAEC]">
                  {searchRunState.results.map((res) => {
                    const alreadySaved = isSaved(res.companyName);
                    return (
                      <tr key={res.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#202124]">
                            {res.companyName}
                          </div>
                          <div className="text-[11px] text-[#70757D] max-w-xs truncate mt-0.5">
                            {res.summary}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          <a
                            href={res.website}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                          >
                            {res.website.replace('https://', '')}
                            <ExternalLink className="w-3 h-3 text-[#70757D]" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="text-[#202124]">{res.industry}</div>
                          <div className="text-[#70757D] text-[11px] font-mono">{res.employeeRange || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className="font-medium text-[#202124]">
                            {res.fundingStage || 'Undisclosed'}
                          </span>
                          {res.hiringRolesCount && res.hiringRolesCount > 0 ? (
                            <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                              <Flame className="w-3 h-3" />
                              {res.hiringRolesCount} open roles
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {res.techStack?.slice(0, 3).map((t, i) => (
                              <span key={i} className="text-[10px] bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#70757D] whitespace-nowrap">
                          {res.source}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {res.status === 'scraped' && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Scraped
                            </span>
                          )}
                          {res.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Pending
                            </span>
                          )}
                          {res.status === 'failed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewCompany(res)}
                              className="px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F1F5F9] border border-[#E9EAEC] rounded-md transition-colors"
                              title="View full company details"
                            >
                              View
                            </button>
                            {alreadySaved ? (
                              <span className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md inline-flex items-center gap-1">
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                Saved
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => saveProspectFromDiscovery(res)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors"
                              >
                                Save Prospect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Job History */}
      <div className="space-y-4 pt-4 border-t border-[#E9EAEC]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#202124]">
              Discovery Job History
            </h3>
            <p className="text-xs text-[#70757D] mt-0.5">
              Log of previous crawler jobs and parameters.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E9EAEC] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E9EAEC] bg-[#F8F9FA] text-[11px] font-semibold text-[#70757D] uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Job ID</th>
                  <th scope="col" className="py-3 px-4">Keyword</th>
                  <th scope="col" className="py-3 px-4">Location</th>
                  <th scope="col" className="py-3 px-4">Target Parameters</th>
                  <th scope="col" className="py-3 px-4 text-right">Discovered</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EAEC]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#202124]">
                      {job.id}
                    </td>
                    <td className="py-3 px-4 text-[#202124] font-medium max-w-[180px] truncate">
                      {job.keyword}
                    </td>
                    <td className="py-3 px-4 text-[#70757D] text-xs whitespace-nowrap">
                      {job.location}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#70757D]">
                      <div className="truncate max-w-[220px]">
                        {job.employeeRangeFilter && job.employeeRangeFilter !== 'All Sizes' ? `${job.employeeRangeFilter} · ` : ''}
                        {job.fundingStageFilter && job.fundingStageFilter !== 'All Stages' ? `${job.fundingStageFilter} · ` : ''}
                        {job.sources.slice(0, 2).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">
                      {job.discoveredCount}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#70757D] font-mono tabular-nums whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
