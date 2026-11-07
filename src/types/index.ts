/**
 * Core TypeScript definitions for Scout
 * B2B Prospect Discovery & Website Intelligence
 */

export type ScrapingStatus = 'scraped' | 'pending' | 'failed';

export interface VerifiedFieldStatus {
  email: boolean;
  phone: boolean;
  website: boolean;
  linkedin: boolean;
}

export interface DiscoveredJobListing {
  title: string;
  department?: string;
  location: string;
  url?: string;
}

export interface ScrapingHistoryEntry {
  id: string;
  timestamp: string;
  status: ScrapingStatus;
  pagesScanned: number;
  durationMs: number;
  errorReason?: string;
}

export type FundingStage = 'Bootstrapped' | 'Seed' | 'Series A-B' | 'Growth / Series C+' | 'Public' | 'Undisclosed';

export type EmployeeRange = '1-10' | '11-50' | '51-200' | '201-500' | '500+' | 'All Sizes';

export type QualificationStatus = 'discovered' | 'under_review' | 'qualified' | 'contacted' | 'disqualified';

export interface DomainHealth {
  sslValid: boolean;
  responseTimeMs: number;
  hasSpfRecord: boolean;
  hasDmarcRecord: boolean;
  detectedCms?: string;
}

export interface Prospect {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  location: string;
  publicEmail: string;
  phone: string;
  linkedinUrl: string;
  contactPageUrl: string;
  careersPageUrl: string;
  description: string;
  scrapingStatus: ScrapingStatus;
  discoveredDate: string;
  lastUpdated: string;
  verified: VerifiedFieldStatus;
  discoveredJobListings: DiscoveredJobListing[];
  sourceUrls: string[];
  scrapingHistory: ScrapingHistoryEntry[];
  employeeRange?: string;
  techStack?: string[];
  fundingStage?: FundingStage;
  hiringVelocity?: 'Aggressive' | 'Moderate' | 'Low' | 'None';
  foundedYear?: number;
  qualificationStatus?: QualificationStatus;
  analystNotes?: string;
  tags?: string[];
  domainHealth?: DomainHealth;
}

export interface SearchPreset {
  id: string;
  name: string;
  keyword: string;
  location: string;
  category: string;
  sources: string[];
  maxResults: number;
  employeeRange?: string;
  fundingStage?: string;
}

export type DiscoveryJobStatus = 'completed' | 'running' | 'failed' | 'queued';

export interface DiscoveryResult {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  location: string;
  source: string;
  status: ScrapingStatus;
  saved: boolean;
  matchedKeyword: string;
  summary: string;
  employeeRange?: string;
  fundingStage?: FundingStage;
  techStack?: string[];
  hiringRolesCount?: number;
  // Contact data found while scraping (real backend); absent when not found.
  publicEmail?: string;
  phone?: string;
  linkedinUrl?: string;
  contactPageUrl?: string;
  careersPageUrl?: string;
}

export interface DiscoveryJob {
  id: string;
  name: string;
  keyword: string;
  location: string;
  category: string;
  sources: string[];
  maxResults: number;
  discoveredCount: number;
  scrapedCount: number;
  status: DiscoveryJobStatus;
  createdAt: string;
  completedAt?: string;
  results?: DiscoveryResult[];
  employeeRangeFilter?: string;
  fundingStageFilter?: string;
  techKeywordFilter?: string;
}

export interface DashboardStats {
  totalProspects: number;
  successfullyScraped: number;
  newProspects: number;
  failedScrapes: number;
}

export type ActivityType = 
  | 'search_completed' 
  | 'website_scraped' 
  | 'prospect_saved' 
  | 'scraping_failed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  referenceId?: string;
}

export interface DiscoverySourceConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'standby' | 'rate_limited';
}

export interface AppSettings {
  appName: string;
  defaultCountry: string;
  defaultResultLimit: number;
  apiBaseUrl: string;
  apiStatus: 'connected' | 'disconnected' | 'connecting';
  maxPagesPerWebsite: number;
  requestTimeoutSeconds: number;
  respectRobotsTxt: boolean;
  skipDuplicates: boolean;
  sources: DiscoverySourceConfig[];
}

export interface ProspectFilters {
  searchQuery: string;
  industry: string;
  location: string;
  scrapingStatus: string;
  employeeRange?: string;
  fundingStage?: string;
  techKeyword?: string;
  qualificationStatus?: string;
  tag?: string;
}

export type SortField = 'companyName' | 'industry' | 'location' | 'discoveredDate' | 'scrapingStatus' | 'fundingStage' | 'qualificationStatus';
export type SortOrder = 'asc' | 'desc';
