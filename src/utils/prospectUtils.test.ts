import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterProspects,
  sortProspects,
  calculateDashboardStats,
  generateProspectsCsv,
  validateSearchQuery,
} from './prospectUtils';
import { Prospect } from '../types';

const mockProspects: Prospect[] = [
  {
    id: 'p-1',
    companyName: 'Acme Cloud Solutions',
    website: 'https://acmecloud.io',
    industry: 'Software Development',
    location: 'San Francisco, CA',
    publicEmail: 'contact@acmecloud.io',
    phone: '+1 415-555-0199',
    linkedinUrl: 'https://linkedin.com/company/acmecloud',
    contactPageUrl: 'https://acmecloud.io/contact',
    careersPageUrl: 'https://acmecloud.io/careers',
    description: 'B2B enterprise infrastructure.',
    scrapingStatus: 'scraped',
    discoveredDate: '2026-11-01T10:00:00Z',
    lastUpdated: '2026-11-02T12:00:00Z',
    verified: { email: true, phone: true, website: true, linkedin: true },
    discoveredJobListings: [{ title: 'Senior Backend Engineer', location: 'San Francisco, CA' }],
    sourceUrls: ['https://brave.com/search?q=acme'],
    scrapingHistory: [{ id: 'sh-1', timestamp: '2026-11-02T12:00:00Z', status: 'scraped', pagesScanned: 8, durationMs: 1420 }]
  },
  {
    id: 'p-2',
    companyName: 'Zenith Health Systems',
    website: 'https://zenithhealth.tech',
    industry: 'Healthcare',
    location: 'Boston, MA',
    publicEmail: 'info@zenithhealth.tech',
    phone: '+1 617-555-0144',
    linkedinUrl: 'https://linkedin.com/company/zenithhealth',
    contactPageUrl: 'https://zenithhealth.tech/contact',
    careersPageUrl: 'https://zenithhealth.tech/jobs',
    description: 'Clinical data analytics.',
    scrapingStatus: 'pending',
    discoveredDate: '2026-11-05T09:00:00Z',
    lastUpdated: '2026-11-05T09:00:00Z',
    verified: { email: false, phone: false, website: true, linkedin: false },
    discoveredJobListings: [],
    sourceUrls: ['https://clutch.co/profile/zenith'],
    scrapingHistory: []
  },
  {
    id: 'p-3',
    companyName: 'Apex Talent Recruitment',
    website: 'https://apextalent.co',
    industry: 'Recruitment',
    location: 'Austin, TX',
    publicEmail: 'team@apextalent.co',
    phone: '+1 512-555-0188',
    linkedinUrl: 'https://linkedin.com/company/apextalent',
    contactPageUrl: 'https://apextalent.co/contact',
    careersPageUrl: '',
    description: 'Executive recruiting agency.',
    scrapingStatus: 'failed',
    discoveredDate: '2026-10-15T08:00:00Z',
    lastUpdated: '2026-10-15T08:00:00Z',
    verified: { email: false, phone: false, website: false, linkedin: false },
    discoveredJobListings: [],
    sourceUrls: ['https://ycombinator.com/companies'],
    scrapingHistory: [{ id: 'sh-2', timestamp: '2026-10-15T08:00:00Z', status: 'failed', pagesScanned: 1, durationMs: 400, errorReason: 'Timeout' }]
  }
];

test('filterProspects matches keyword in company name or industry', () => {
  const filtered = filterProspects(mockProspects, {
    searchQuery: 'Acme',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'p-1');
});

test('filterProspects filters correctly by industry and status', () => {
  const filtered = filterProspects(mockProspects, {
    searchQuery: '',
    industry: 'Healthcare',
    location: 'all',
    scrapingStatus: 'pending',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].companyName, 'Zenith Health Systems');
});

test('sortProspects sorts alphabetically by company name', () => {
  const sortedAsc = sortProspects(mockProspects, 'companyName', 'asc');
  assert.equal(sortedAsc[0].companyName, 'Acme Cloud Solutions');
  assert.equal(sortedAsc[1].companyName, 'Apex Talent Recruitment');
  assert.equal(sortedAsc[2].companyName, 'Zenith Health Systems');

  const sortedDesc = sortProspects(mockProspects, 'companyName', 'desc');
  assert.equal(sortedDesc[0].companyName, 'Zenith Health Systems');
});

test('calculateDashboardStats produces accurate summary counts', () => {
  const stats = calculateDashboardStats(mockProspects);
  assert.equal(stats.totalProspects, 3);
  assert.equal(stats.successfullyScraped, 1);
  assert.equal(stats.failedScrapes, 1);
  assert.ok(stats.newProspects >= 1);
});

test('generateProspectsCsv creates valid CSV header and rows', () => {
  const csv = generateProspectsCsv(mockProspects);
  assert.ok(csv.includes('"Company Name"'));
  assert.ok(csv.includes('"Acme Cloud Solutions"'));
  assert.ok(csv.includes('"https://acmecloud.io"'));
  assert.ok(csv.includes('"scraped"'));
});

test('validateSearchQuery validates input requirements', () => {
  const invalid = validateSearchQuery('', '', []);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.keyword);
  assert.ok(invalid.errors.location);
  assert.ok(invalid.errors.sources);

  const valid = validateSearchQuery('Fintech startups', 'United States', ['Brave Search']);
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('filterProspects filters by employeeRange, fundingStage, and techKeyword', () => {
  const enrichedProspects: Prospect[] = [
    {
      ...mockProspects[0],
      employeeRange: '50-100 employees',
      fundingStage: 'Series A-B',
      techStack: ['AWS', 'TypeScript', 'Docker'],
    },
    {
      ...mockProspects[1],
      employeeRange: '10-25 employees',
      fundingStage: 'Seed',
      techStack: ['Python', 'PostgreSQL'],
    },
  ];

  // Match by funding stage
  const seedOnly = filterProspects(enrichedProspects, {
    searchQuery: '',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
    fundingStage: 'Seed',
  });
  assert.equal(seedOnly.length, 1);
  assert.equal(seedOnly[0].companyName, 'Zenith Health Systems');

  // Match by tech stack keyword
  const awsOnly = filterProspects(enrichedProspects, {
    searchQuery: '',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
    techKeyword: 'docker',
  });
  assert.equal(awsOnly.length, 1);
  assert.equal(awsOnly[0].companyName, 'Acme Cloud Solutions');
});

test('filterProspects filters by qualificationStatus and tags', () => {
  const qualifiedProspects: Prospect[] = [
    {
      ...mockProspects[0],
      qualificationStatus: 'qualified',
      tags: ['High-Priority', 'Fintech'],
      analystNotes: 'Strong enterprise fit.',
    },
    {
      ...mockProspects[1],
      qualificationStatus: 'under_review',
      tags: ['Healthcare'],
      analystNotes: 'Waiting on team decision.',
    },
    {
      ...mockProspects[2],
      qualificationStatus: 'disqualified',
      tags: ['Low-Budget'],
    },
  ];

  // Filter by qualificationStatus
  const qualifiedOnly = filterProspects(qualifiedProspects, {
    searchQuery: '',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
    qualificationStatus: 'qualified',
  });
  assert.equal(qualifiedOnly.length, 1);
  assert.equal(qualifiedOnly[0].companyName, 'Acme Cloud Solutions');

  // Filter by tag
  const fintechTag = filterProspects(qualifiedProspects, {
    searchQuery: '',
    industry: 'all',
    location: 'all',
    scrapingStatus: 'all',
    tag: 'Fintech',
  });
  assert.equal(fintechTag.length, 1);
  assert.equal(fintechTag[0].companyName, 'Acme Cloud Solutions');

  // Verify CSV export includes qualification and notes
  const csv = generateProspectsCsv(qualifiedProspects);
  assert.ok(csv.includes('"Qualification Status"'));
  assert.ok(csv.includes('"Tags"'));
  assert.ok(csv.includes('"Analyst Notes"'));
  assert.ok(csv.includes('"qualified"'));
  assert.ok(csv.includes('"High-Priority; Fintech"'));
  assert.ok(csv.includes('"Strong enterprise fit."'));
});
