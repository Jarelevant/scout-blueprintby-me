/**
 * Centralized API Client & Service Adapter for Scout
 *
 * Two modes, chosen at build time:
 * - Remote: VITE_API_BASE_URL is set (e.g. https://api.blueprintby.me/scout/v1). Calls the
 *   shared FastAPI backend with a user JWT; async jobs (discovery, scraping) are polled here so
 *   callers still get a finished result.
 * - Mock: no VITE_API_BASE_URL. Realistic local simulation persisted in localStorage.
 */

import {
  Prospect,
  DiscoveryJob,
  DashboardStats,
  AppSettings,
  ScrapingStatus,
  DiscoveryResult,
  ActivityItem,
  QualificationStatus,
} from '../types';
import {
  INITIAL_PROSPECTS,
  INITIAL_DISCOVERY_JOBS,
  INITIAL_SETTINGS,
  INITIAL_ACTIVITIES,
} from './mockData';
import { calculateDashboardStats } from '../utils/prospectUtils';

const STORAGE_KEY_PROSPECTS = 'blueprint_prospects_v1';
const STORAGE_KEY_JOBS = 'blueprint_jobs_v1';
const STORAGE_KEY_SETTINGS = 'blueprint_settings_v1';
const STORAGE_KEY_ACTIVITIES = 'blueprint_activities_v1';
const STORAGE_KEY_AUTH = 'blueprint_auth_v1';

/** Fired on window when the backend needs (re-)authentication. */
export const AUTH_REQUIRED_EVENT = 'scout:auth-required';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SearchProspectsRequest {
  keyword: string;
  location: string;
  category: string;
  sources: string[];
  maxResults: number;
  employeeRange?: string;
  fundingStage?: string;
  techKeywords?: string;
  hiringIntentOnly?: boolean;
  minVerifiedEmail?: boolean;
}

export interface SearchProspectsResponse {
  jobId: string;
  status: 'queued' | 'running';
  message: string;
}

export interface ScrapeProspectResponse {
  jobId: string;
  prospectId: string;
  status: 'running' | 'completed' | 'failed';
  message: string;
}

export interface ApiHealthResponse {
  status: 'healthy' | 'offline';
  version: string;
  latencyMs: number;
  environment: string;
}

class ApiClient {
  private baseUrl: string;
  /** True when built against a real backend (VITE_API_BASE_URL set). */
  public readonly remote: boolean;
  private tokens: AuthTokens | null;

  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    this.remote = Boolean(envUrl);
    this.baseUrl = envUrl || 'http://localhost:8000/api/v1';
    this.tokens = this.loadTokens();
  }

  // --- Auth (remote mode) ---
  // Tokens live in localStorage: acceptable for this internal tool, but any XSS can read them.

  public isAuthenticated(): boolean {
    return !this.remote || this.tokens !== null;
  }

  async login(email: string, password: string): Promise<void> {
    const res = await fetch(`${this.platformBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw await this.toError(res);
    const data = await res.json();
    this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  }

  logout() {
    this.setTokens(null);
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }

  private platformBase(): string {
    return `${new URL(this.baseUrl).origin}/v1`;
  }

  private loadTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  }

  private setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens;
    try {
      if (tokens) localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(tokens));
      else localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // Storage unavailable: tokens stay in memory for this tab.
    }
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.tokens) return false;
    try {
      const res = await fetch(`${this.platformBase()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false;
    }
  }

  private async toError(res: Response): Promise<ApiError> {
    try {
      const body = await res.json();
      return new ApiError(res.status, body?.error?.message ?? res.statusText, body?.error?.code);
    } catch {
      return new ApiError(res.status, res.statusText);
    }
  }

  private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.tokens) headers.Authorization = `Bearer ${this.tokens.accessToken}`;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      if (retry && (await this.refreshTokens())) return this.request<T>(method, path, body, false);
      this.setTokens(null);
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
    }
    if (!res.ok) throw await this.toError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /** Re-fetch until `done` holds; the backend runs discovery/scraping on a worker. */
  private async poll<T>(fetchOnce: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      const value = await fetchOnce();
      if (done(value)) return value;
      if (Date.now() > deadline) throw new ApiError(408, 'Timed out waiting for the job to finish');
      await sleep(POLL_INTERVAL_MS);
    }
  }

  private async getOrNull<T>(path: string): Promise<T | null> {
    try {
      return await this.request<T>('GET', path);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  // --- Local Storage Helpers ---
  private loadStoredProspects(): Prospect[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROSPECTS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_PROSPECTS;
  }

  private saveStoredProspects(prospects: Prospect[]) {
    try {
      localStorage.setItem(STORAGE_KEY_PROSPECTS, JSON.stringify(prospects));
    } catch {
      // Ignore
    }
  }

  private loadStoredJobs(): DiscoveryJob[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JOBS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_DISCOVERY_JOBS;
  }

  private saveStoredJobs(jobs: DiscoveryJob[]) {
    try {
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
    } catch {
      // Ignore
    }
  }

  private loadStoredSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_SETTINGS;
  }

  private saveStoredSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  private loadStoredActivities(): ActivityItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_ACTIVITIES;
  }

  private saveStoredActivities(activities: ActivityItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    } catch {
      // Ignore
    }
  }

  // --- API Methods ---

  /**
   * GET /api/v1/dashboard/stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    if (this.remote) return this.request('GET', '/dashboard/stats');
    const prospects = this.loadStoredProspects();
    return calculateDashboardStats(prospects);
  }

  /**
   * GET /api/v1/prospects
   */
  async getProspects(): Promise<Prospect[]> {
    if (this.remote) return this.request('GET', '/prospects');
    return this.loadStoredProspects();
  }

  /**
   * GET /api/v1/prospects/{id}
   */
  async getProspectById(id: string): Promise<Prospect | null> {
    if (this.remote) return this.getOrNull(`/prospects/${encodeURIComponent(id)}`);
    const list = this.loadStoredProspects();
    return list.find((p) => p.id === id) || null;
  }

  /**
   * DELETE /api/v1/prospects/{id}
   */
  async deleteProspect(id: string): Promise<boolean> {
    if (this.remote) {
      await this.request('DELETE', `/prospects/${encodeURIComponent(id)}`);
      return true;
    }
    const list = this.loadStoredProspects();
    const updated = list.filter((p) => p.id !== id);
    this.saveStoredProspects(updated);
    return true;
  }

  /**
   * Batch DELETE prospects
   */
  async deleteMultipleProspects(ids: string[]): Promise<boolean> {
    if (this.remote) {
      await this.request('POST', '/prospects/batch-delete', { ids });
      return true;
    }
    const set = new Set(ids);
    const list = this.loadStoredProspects();
    const updated = list.filter((p) => !set.has(p.id));
    this.saveStoredProspects(updated);
    return true;
  }

  /**
   * POST /api/v1/prospects (Save new or updated prospect)
   */
  async saveProspect(prospect: Prospect): Promise<Prospect> {
    if (this.remote) return this.request('POST', '/prospects', prospect);
    const list = this.loadStoredProspects();
    const existingIndex = list.findIndex((p) => p.id === prospect.id);
    let updated: Prospect[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...prospect, lastUpdated: new Date().toISOString() };
    } else {
      updated = [prospect, ...list];
    }
    this.saveStoredProspects(updated);

    // Record activity
    const activities = this.loadStoredActivities();
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'prospect_saved',
      title: 'New Prospect Saved',
      description: `Saved "${prospect.companyName}" to prospect database.`,
      timestamp: new Date().toISOString(),
      referenceId: prospect.id,
    };
    this.saveStoredActivities([newAct, ...activities]);

    return prospect;
  }

  /**
   * PATCH /api/v1/prospects/:id/qualification
   */
  async updateProspectQualification(id: string, qualificationStatus: QualificationStatus): Promise<Prospect> {
    if (this.remote) {
      return this.request('PATCH', `/prospects/${encodeURIComponent(id)}/qualification`, { qualificationStatus });
    }
    const list = this.loadStoredProspects();
    const existing = list.find((p) => p.id === id);
    if (!existing) {
      throw new Error(`Prospect with id ${id} not found`);
    }
    const updatedProspect: Prospect = {
      ...existing,
      qualificationStatus,
      lastUpdated: new Date().toISOString(),
    };
    return this.saveProspect(updatedProspect);
  }

  /**
   * PATCH /api/v1/prospects/:id/notes-tags
   */
  async updateProspectNotesAndTags(id: string, analystNotes: string, tags: string[]): Promise<Prospect> {
    if (this.remote) {
      return this.request('PATCH', `/prospects/${encodeURIComponent(id)}/notes-tags`, { analystNotes, tags });
    }
    const list = this.loadStoredProspects();
    const existing = list.find((p) => p.id === id);
    if (!existing) {
      throw new Error(`Prospect with id ${id} not found`);
    }
    const updatedProspect: Prospect = {
      ...existing,
      analystNotes,
      tags,
      lastUpdated: new Date().toISOString(),
    };
    return this.saveProspect(updatedProspect);
  }

  /**
   * POST /api/v1/discovery/search
   */
  async startDiscoverySearch(req: SearchProspectsRequest): Promise<{
    job: DiscoveryJob;
    generatedResults: DiscoveryResult[];
  }> {
    if (this.remote) {
      const { jobId } = await this.request<SearchProspectsResponse>('POST', '/discovery/search', req);
      const job = await this.poll(
        async () => {
          const j = await this.getJobById(jobId);
          if (!j) throw new ApiError(404, `Job ${jobId} disappeared`);
          return j;
        },
        (j) => j.status === 'completed' || j.status === 'failed'
      );
      if (job.status === 'failed') {
        throw new ApiError(500, (job as DiscoveryJob & { error?: string }).error || 'Discovery failed');
      }
      return { job, generatedResults: job.results ?? [] };
    }
    const jobId = `job-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    // Generate realistic simulated results matching requested keyword, location, and category
    const generatedResults = this.generateSimulatedDiscoveryResults(req);

    const newJob: DiscoveryJob = {
      id: jobId,
      name: `${req.category} in ${req.location}`,
      keyword: req.keyword,
      location: req.location,
      category: req.category,
      sources: req.sources,
      maxResults: req.maxResults,
      discoveredCount: generatedResults.length,
      scrapedCount: generatedResults.filter((r) => r.status === 'scraped').length,
      status: 'completed',
      createdAt: nowIso,
      completedAt: new Date(Date.now() + 2000).toISOString(),
      results: generatedResults,
      employeeRangeFilter: req.employeeRange || 'All Sizes',
      fundingStageFilter: req.fundingStage || 'All Stages',
      techKeywordFilter: req.techKeywords || '',
    };

    const jobs = this.loadStoredJobs();
    this.saveStoredJobs([newJob, ...jobs]);

    // Record activity
    const activities = this.loadStoredActivities();
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'search_completed',
      title: 'Search Job Completed',
      description: `Discovered ${generatedResults.length} companies for "${req.keyword}" in ${req.location}.`,
      timestamp: new Date().toISOString(),
      referenceId: newJob.id,
    };
    this.saveStoredActivities([newAct, ...activities]);

    return { job: newJob, generatedResults };
  }

  /**
   * GET /api/v1/jobs
   */
  async getJobs(): Promise<DiscoveryJob[]> {
    if (this.remote) return this.request('GET', '/jobs');
    return this.loadStoredJobs();
  }

  /**
   * GET /api/v1/jobs/{id}
   */
  async getJobById(id: string): Promise<DiscoveryJob | null> {
    if (this.remote) return this.getOrNull(`/jobs/${encodeURIComponent(id)}`);
    const jobs = this.loadStoredJobs();
    return jobs.find((j) => j.id === id) || null;
  }

  /**
   * POST /api/v1/prospects/{id}/scrape
   */
  async scrapeProspectWebsite(prospectId: string): Promise<Prospect> {
    if (this.remote) {
      const path = `/prospects/${encodeURIComponent(prospectId)}`;
      await this.request<ScrapeProspectResponse>('POST', `${path}/scrape`);
      return this.poll(
        () => this.request<Prospect>('GET', path),
        (p) => p.scrapingStatus !== 'pending'
      );
    }
    const list = this.loadStoredProspects();
    const target = list.find((p) => p.id === prospectId);
    if (!target) throw new Error('Prospect not found');

    const duration = Math.floor(Math.random() * 1200) + 800;
    const pagesScanned = Math.floor(Math.random() * 8) + 4;
    const newHistoryEntry = {
      id: `sh-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'scraped' as ScrapingStatus,
      pagesScanned,
      durationMs: duration,
    };

    const updatedProspect: Prospect = {
      ...target,
      scrapingStatus: 'scraped',
      lastUpdated: new Date().toISOString(),
      verified: {
        email: true,
        phone: target.phone ? true : false,
        website: true,
        linkedin: target.linkedinUrl ? true : false,
      },
      scrapingHistory: [newHistoryEntry, ...target.scrapingHistory],
    };

    const updatedList = list.map((p) => (p.id === prospectId ? updatedProspect : p));
    this.saveStoredProspects(updatedList);

    // Record activity
    const activities = this.loadStoredActivities();
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'website_scraped',
      title: 'Website Successfully Scraped',
      description: `Refreshed public intelligence and contacts for ${target.companyName} (${pagesScanned} pages).`,
      timestamp: new Date().toISOString(),
      referenceId: target.id,
    };
    this.saveStoredActivities([newAct, ...activities]);

    return updatedProspect;
  }

  /**
   * GET /api/v1/settings
   */
  async getSettings(): Promise<AppSettings> {
    if (this.remote) return this.request('GET', '/settings');
    return this.loadStoredSettings();
  }

  /**
   * PUT /api/v1/settings
   */
  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    if (this.remote) return this.request('PUT', '/settings', settings);
    this.saveStoredSettings(settings);
    return settings;
  }

  /**
   * GET /api/v1/activities
   */
  async getActivities(): Promise<ActivityItem[]> {
    if (this.remote) return this.request('GET', '/activities?limit=50');
    return this.loadStoredActivities();
  }

  /**
   * GET <origin>/healthz of the backend (or of a URL typed into Settings).
   */
  async testBackendConnection(customUrl?: string): Promise<ApiHealthResponse> {
    const target = customUrl || this.baseUrl;
    const start = performance.now();
    try {
      const res = await fetch(`${new URL(target).origin}/healthz`, {
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return {
        status: 'healthy',
        version: body.version ?? 'unknown',
        latencyMs,
        environment: body.environment ?? 'unknown',
      };
    } catch {
      return {
        status: 'offline',
        version: '',
        latencyMs: Math.round(performance.now() - start),
        environment: '',
      };
    }
  }

  /**
   * Generator for realistic search discovery entities
   */
  private generateSimulatedDiscoveryResults(req: SearchProspectsRequest): DiscoveryResult[] {
    const templates = [
      {
        name: 'Apex Software Labs',
        domain: 'apexsoftwarelabs.io',
        desc: 'Enterprise SaaS architecture & API platform engineering',
        employeeRange: '51-200',
        fundingStage: 'Series A-B' as const,
        techStack: ['TypeScript', 'AWS', 'PostgreSQL', 'Go'],
        hiringRolesCount: 4,
      },
      {
        name: 'Helios Data Solutions',
        domain: 'heliosdata.tech',
        desc: 'Real-time telemetry pipelines and analytics infrastructure',
        employeeRange: '11-50',
        fundingStage: 'Seed' as const,
        techStack: ['Python', 'Kafka', 'ClickHouse', 'Kubernetes'],
        hiringRolesCount: 2,
      },
      {
        name: 'Catalyst Talent Group',
        domain: 'catalysttalent.co',
        desc: 'Specialized executive engineering recruitment and placement',
        employeeRange: '11-50',
        fundingStage: 'Bootstrapped' as const,
        techStack: ['Greenhouse', 'Salesforce', 'Next.js'],
        hiringRolesCount: 1,
      },
      {
        name: 'PulseHealth Informatics',
        domain: 'pulsehealth.net',
        desc: 'Clinical workflow automation and HIPAA-compliant data routing',
        employeeRange: '51-200',
        fundingStage: 'Series A-B' as const,
        techStack: ['FHIR', 'Python', 'AWS GovCloud', 'React'],
        hiringRolesCount: 3,
      },
      {
        name: 'NorthStar Digital Engineering',
        domain: 'northstardigital.io',
        desc: 'Full-stack web application development and cloud modernization',
        employeeRange: '201-500',
        fundingStage: 'Growth / Series C+' as const,
        techStack: ['React', 'Node.js', 'Docker', 'Google Cloud'],
        hiringRolesCount: 5,
      },
      {
        name: 'Vanguard Cyber Services',
        domain: 'vanguardcyber.net',
        desc: 'SOC2 readiness, offensive security auditing, and cloud governance',
        employeeRange: '11-50',
        fundingStage: 'Bootstrapped' as const,
        techStack: ['Burp Suite', 'Terraform', 'AWS'],
        hiringRolesCount: 2,
      },
      {
        name: 'OmniFlow Logistics Tech',
        domain: 'omniflowtech.com',
        desc: 'Supply chain visibility APIs and fleet dispatch coordination',
        employeeRange: '51-200',
        fundingStage: 'Series A-B' as const,
        techStack: ['Elixir', 'PostgreSQL', 'Redis', 'React'],
        hiringRolesCount: 3,
      },
      {
        name: 'Stratum Advisory Partners',
        domain: 'stratumadvisory.com',
        desc: 'B2B technology diligence and software integration consulting',
        employeeRange: '1-10',
        fundingStage: 'Bootstrapped' as const,
        techStack: ['Tableau', 'PowerBI', 'Snowflake'],
        hiringRolesCount: 0,
      },
      {
        name: 'Beacon Scale Technologies',
        domain: 'beaconscale.io',
        desc: 'Distributed caching and high-availability database orchestration',
        employeeRange: '11-50',
        fundingStage: 'Seed' as const,
        techStack: ['Rust', 'Redis', 'Kubernetes'],
        hiringRolesCount: 3,
      },
      {
        name: 'Aether Commerce Studio',
        domain: 'aethercommerce.store',
        desc: 'Headless storefront architecture and payment gateway integration',
        employeeRange: '11-50',
        fundingStage: 'Seed' as const,
        techStack: ['Shopify Plus', 'Next.js', 'Stripe', 'Tailwind'],
        hiringRolesCount: 2,
      },
      {
        name: 'Summit Logic Systems',
        domain: 'summitlogic.net',
        desc: 'Custom enterprise software development and legacy modernization',
        employeeRange: '201-500',
        fundingStage: 'Growth / Series C+' as const,
        techStack: ['Java', 'Spring Boot', 'Oracle', 'Azure'],
        hiringRolesCount: 6,
      },
      {
        name: 'Horizon Cloud Networks',
        domain: 'horizoncloud.io',
        desc: 'Kubernetes multi-region deployment and zero-trust security mesh',
        employeeRange: '51-200',
        fundingStage: 'Series A-B' as const,
        techStack: ['Go', 'Kubernetes', 'Istio', 'GCP'],
        hiringRolesCount: 4,
      },
    ];

    const sourcePool = req.sources.length > 0 ? req.sources : ['Brave Search API'];
    const count = Math.min(req.maxResults, 8); // Keep clean and scannable
    const results: DiscoveryResult[] = [];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const source = sourcePool[i % sourcePool.length];
      const id = `disc-${Date.now()}-${i}`;
      const status: ScrapingStatus = i === 3 ? 'pending' : (i === 6 ? 'failed' : 'scraped');

      // Use user request filters if specified or fall back to template
      const resolvedSize = req.employeeRange && req.employeeRange !== 'All Sizes'
        ? req.employeeRange
        : template.employeeRange;

      const resolvedFunding = req.fundingStage && req.fundingStage !== 'All Stages'
        ? (req.fundingStage as any)
        : template.fundingStage;

      const resolvedTech = req.techKeywords && req.techKeywords.trim() !== ''
        ? [req.techKeywords.trim(), ...template.techStack]
        : template.techStack;

      results.push({
        id,
        companyName: `${template.name}`,
        website: `https://${template.domain}`,
        industry: req.category || 'Software Development',
        location: req.location,
        source,
        status,
        saved: false,
        matchedKeyword: req.keyword,
        summary: template.desc,
        employeeRange: `${resolvedSize} employees`,
        fundingStage: resolvedFunding,
        techStack: resolvedTech,
        hiringRolesCount: template.hiringRolesCount,
        ...(status === 'scraped' && {
          publicEmail: `contact@${template.domain}`,
          phone: '+1 (555) 019-8200',
          linkedinUrl: `https://linkedin.com/company/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          contactPageUrl: `https://${template.domain}/contact`,
          careersPageUrl: `https://${template.domain}/careers`,
        }),
      });
    }

    return results;
  }
}

export const apiClient = new ApiClient();
