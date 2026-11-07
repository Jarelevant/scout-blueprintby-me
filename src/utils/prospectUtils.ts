import { Prospect, ProspectFilters, SortField, SortOrder, DashboardStats } from '../types';

/**
 * Filter prospects based on query, industry, location, and scraping status
 */
export function filterProspects(
  prospects: Prospect[],
  filters: ProspectFilters
): Prospect[] {
  return prospects.filter((prospect) => {
    // Search query matching company name, website, or email
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = prospect.companyName.toLowerCase().includes(q);
      const matchWebsite = prospect.website.toLowerCase().includes(q);
      const matchEmail = prospect.publicEmail.toLowerCase().includes(q);
      const matchIndustry = prospect.industry.toLowerCase().includes(q);
      if (!matchName && !matchWebsite && !matchEmail && !matchIndustry) {
        return false;
      }
    }

    // Industry filter
    if (filters.industry && filters.industry !== 'all') {
      if (prospect.industry.toLowerCase() !== filters.industry.toLowerCase()) {
        return false;
      }
    }

    // Location filter
    if (filters.location && filters.location !== 'all') {
      if (!prospect.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Scraping status filter
    if (filters.scrapingStatus && filters.scrapingStatus !== 'all') {
      if (prospect.scrapingStatus !== filters.scrapingStatus) {
        return false;
      }
    }

    // Employee headcount filter
    if (filters.employeeRange && filters.employeeRange !== 'all') {
      if (prospect.employeeRange) {
        if (!prospect.employeeRange.toLowerCase().includes(filters.employeeRange.toLowerCase())) {
          return false;
        }
      } else {
        return false;
      }
    }

    // Funding stage filter
    if (filters.fundingStage && filters.fundingStage !== 'all') {
      if (prospect.fundingStage !== filters.fundingStage) {
        return false;
      }
    }

    // Technographics filter (techKeyword)
    if (filters.techKeyword && filters.techKeyword.trim() !== '') {
      const tk = filters.techKeyword.toLowerCase().trim();
      const hasTech = prospect.techStack?.some((t) => t.toLowerCase().includes(tk));
      if (!hasTech) {
        return false;
      }
    }

    // Qualification workflow stage filter
    if (filters.qualificationStatus && filters.qualificationStatus !== 'all') {
      if ((prospect.qualificationStatus || 'discovered') !== filters.qualificationStatus) {
        return false;
      }
    }

    // Custom tag filter
    if (filters.tag && filters.tag !== 'all') {
      const hasTag = prospect.tags?.some((t) => t.toLowerCase() === filters.tag?.toLowerCase());
      if (!hasTag) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort prospects by specific field and direction
 */
export function sortProspects(
  prospects: Prospect[],
  field: SortField,
  order: SortOrder
): Prospect[] {
  return [...prospects].sort((a, b) => {
    let aVal = a[field] || '';
    let bVal = b[field] || '';

    if (field === 'discoveredDate') {
      const aTime = new Date(aVal).getTime() || 0;
      const bTime = new Date(bVal).getTime() || 0;
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return order === 'asc' ? cmp : -cmp;
    }

    return 0;
  });
}

/**
 * Calculate accurate dashboard summary metrics
 */
export function calculateDashboardStats(prospects: Prospect[]): DashboardStats {
  const totalProspects = prospects.length;
  const successfullyScraped = prospects.filter((p) => p.scrapingStatus === 'scraped').length;
  const failedScrapes = prospects.filter((p) => p.scrapingStatus === 'failed').length;
  
  // "New prospects" defined as discovered within the last 7 days or status pending
  const now = new Date().getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const newProspects = prospects.filter((p) => {
    const discTime = new Date(p.discoveredDate).getTime();
    return (now - discTime < sevenDaysMs) || p.scrapingStatus === 'pending';
  }).length;

  return {
    totalProspects,
    successfullyScraped,
    newProspects,
    failedScrapes,
  };
}

/**
 * Converts array of prospects to clean, compliant CSV text
 */
export function generateProspectsCsv(prospects: Prospect[]): string {
  const headers = [
    'Company Name',
    'Website',
    'Industry',
    'Location',
    'Employee Size',
    'Funding Stage',
    'Technologies',
    'Qualification Status',
    'Tags',
    'Public Email',
    'Phone',
    'LinkedIn',
    'Scraping Status',
    'Discovered Date',
    'Last Updated',
    'Verified Email',
    'Verified Phone',
    'Verified Website',
    'Analyst Notes'
  ];

  const escapeCell = (str: string | number | boolean | undefined): string => {
    if (str === undefined || str === null) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = prospects.map((p) => [
    escapeCell(p.companyName),
    escapeCell(p.website),
    escapeCell(p.industry),
    escapeCell(p.location),
    escapeCell(p.employeeRange || 'N/A'),
    escapeCell(p.fundingStage || 'Undisclosed'),
    escapeCell(p.techStack?.join('; ') || 'N/A'),
    escapeCell(p.qualificationStatus || 'discovered'),
    escapeCell(p.tags?.join('; ') || ''),
    escapeCell(p.publicEmail),
    escapeCell(p.phone),
    escapeCell(p.linkedinUrl),
    escapeCell(p.scrapingStatus),
    escapeCell(p.discoveredDate),
    escapeCell(p.lastUpdated),
    escapeCell(p.verified.email),
    escapeCell(p.verified.phone),
    escapeCell(p.verified.website),
    escapeCell(p.analystNotes || '')
  ].join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

/**
 * Validates search prospect input params
 */
export function validateSearchQuery(keyword: string, location: string, sources: string[]): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!keyword || keyword.trim().length < 2) {
    errors.keyword = 'Search keyword must be at least 2 characters.';
  }

  if (!location || location.trim().length < 2) {
    errors.location = 'Location is required (e.g., United States or Remote).';
  }

  if (!sources || sources.length === 0) {
    errors.sources = 'Select at least one discovery source.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
