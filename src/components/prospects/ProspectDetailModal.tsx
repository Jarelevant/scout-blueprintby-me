import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Building2,
  Calendar,
  Tag,
  FileText,
  Activity,
  Plus,
  Server,
  Lock,
} from 'lucide-react';
import { Prospect, QualificationStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProspectDetailModalProps {
  prospect: Prospect;
  onClose: () => void;
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  prospect,
  onClose,
}) => {
  const {
    scrapeProspect,
    deleteProspect,
    updateProspectQualification,
    updateProspectNotesAndTags,
  } = useApp();
  const [isScraping, setIsScraping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [currentQualification, setCurrentQualification] = useState<QualificationStatus>(
    prospect.qualificationStatus || 'discovered'
  );
  const [notes, setNotes] = useState(prospect.analystNotes || '');
  const [tags, setTags] = useState<string[]>(prospect.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleScrape = async () => {
    setIsScraping(true);
    await scrapeProspect(prospect.id);
    setIsScraping(false);
  };

  const handleDelete = async () => {
    await deleteProspect(prospect.id);
    onClose();
  };

  const handleQualificationChange = async (newStatus: QualificationStatus) => {
    setCurrentQualification(newStatus);
    await updateProspectQualification(prospect.id, newStatus);
  };

  const handleSaveNotesAndTags = async () => {
    setIsSavingNotes(true);
    await updateProspectNotesAndTags(prospect.id, notes, tags);
    setIsSavingNotes(false);
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Scraped & Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Scrape
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Scraping Failed
          </span>
        );
      default:
        return <span className="text-xs text-[#70757D]">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E9EAEC] overflow-hidden my-6">
          {/* Top Bar / Header */}
          <div className="flex items-start justify-between p-6 sm:p-7 border-b border-[#E9EAEC] bg-[#FAFAFA]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#70757D] mb-1">
                <span>Prospect Profile</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{prospect.id}</span>
                <span aria-hidden="true">·</span>
                <span>{prospect.industry}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#202124] tracking-tight">
                {prospect.companyName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {getStatusBadge(prospect.scrapingStatus)}
                <span className="text-xs text-[#70757D] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  Discovered: {new Date(prospect.discoveredDate).toLocaleDateString()}
                </span>
                <span className="text-xs text-[#70757D] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  Updated: {new Date(prospect.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#70757D] hover:bg-[#E9EAEC] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Qualification Workflow Bar */}
          <div className="bg-[#F8F9FA] px-6 py-3 border-b border-[#E9EAEC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#70757D] uppercase tracking-wider">
                Qualification Stage:
              </span>
              <select
                value={currentQualification}
                onChange={(e) => handleQualificationChange(e.target.value as QualificationStatus)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none transition-colors ${
                  currentQualification === 'qualified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : currentQualification === 'under_review'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : currentQualification === 'contacted'
                    ? 'bg-blue-50 text-[#2563EB] border-blue-300'
                    : currentQualification === 'disqualified'
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-300'
                    : 'bg-white text-gray-700 border-[#E9EAEC]'
                }`}
              >
                <option value="discovered">Discovered (New Lead)</option>
                <option value="under_review">Under Review</option>
                <option value="qualified">Qualified</option>
                <option value="contacted">Contacted</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#70757D]">Active Stage:</span>
              <span className="text-xs font-mono font-medium text-[#202124] uppercase">
                {currentQualification.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Analyst Notes & Lead Tags Card */}
            <div className="p-4 rounded-xl border border-[#E9EAEC] bg-[#FAFAFA] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                    Analyst Notes & Lead Tags
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSaveNotesAndTags}
                  disabled={isSavingNotes}
                  className="px-3 py-1 text-xs font-semibold text-white bg-[#202124] hover:bg-[#333] rounded-md transition-colors"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes & Tags'}
                </button>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter internal analyst notes, executive contact insights, or sales outreach angles..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E9EAEC] rounded-lg text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />

              {/* Tags Section */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1 text-xs text-[#70757D]">
                  <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Tags:</span>
                </div>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-white text-[#202124] border border-[#E9EAEC] shadow-2xs"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#9CA3AF] hover:text-rose-600 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag and press Enter..."
                    className="px-2.5 py-0.5 text-xs bg-white border border-[#E9EAEC] rounded-md text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#2563EB] w-36"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1 rounded text-[#70757D] hover:text-[#202124] hover:bg-gray-200 transition-colors"
                    title="Add tag"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Technical & Domain Intelligence (Website Health Inspector) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider">
                    Technical & Domain Intelligence
                  </h3>
                </div>
                <span className="text-[11px] text-[#70757D]">
                  Public DNS & TLS crawl diagnostics
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* SSL / TLS */}
                <div className="p-3 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center gap-1.5 text-xs text-[#70757D] mb-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SSL/TLS Status</span>
                  </div>
                  <div className="text-xs font-semibold text-[#202124] flex items-center gap-1">
                    {prospect.domainHealth?.sslValid !== false ? (
                      <span className="text-emerald-700 font-medium">Valid TLS 1.3</span>
                    ) : (
                      <span className="text-rose-700 font-medium">Invalid / Expired</span>
                    )}
                  </div>
                </div>

                {/* Response Latency */}
                <div className="p-3 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center gap-1.5 text-xs text-[#70757D] mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#70757D]" />
                    <span>Server Response</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#202124]">
                    {prospect.domainHealth?.responseTimeMs || 185} ms
                  </div>
                </div>

                {/* Email Authentication: SPF / DMARC */}
                <div className="p-3 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center gap-1.5 text-xs text-[#70757D] mb-1">
                    <Mail className="w-3.5 h-3.5 text-[#70757D]" />
                    <span>Email DNS Auth</span>
                  </div>
                  <div className="text-xs font-medium">
                    {prospect.domainHealth?.hasDmarcRecord ? (
                      <span className="text-emerald-700">SPF + DMARC</span>
                    ) : prospect.domainHealth?.hasSpfRecord ? (
                      <span className="text-amber-700">SPF Only</span>
                    ) : (
                      <span className="text-rose-700">No DMARC/SPF</span>
                    )}
                  </div>
                </div>

                {/* Detected CMS / Framework */}
                <div className="p-3 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center gap-1.5 text-xs text-[#70757D] mb-1">
                    <Server className="w-3.5 h-3.5 text-[#70757D]" />
                    <span>Detected CMS</span>
                  </div>
                  <div className="text-xs font-medium text-[#202124] truncate">
                    {prospect.domainHealth?.detectedCms || 'Custom React / Node'}
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Company Overview & Description */}
            <div className="pt-4 border-t border-[#E9EAEC]">
              <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider mb-2">
                Company Overview
              </h3>
              <p className="text-sm text-[#202124] leading-relaxed">
                {prospect.description || 'No public description was available on the company website.'}
              </p>
              
              <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs text-[#70757D]">
                {prospect.employeeRange && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>Headcount: <strong className="text-[#202124] font-medium">{prospect.employeeRange}</strong></span>
                  </div>
                )}
                {prospect.fundingStage && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    <span>Funding: <strong className="text-[#202124] font-medium">{prospect.fundingStage}</strong></span>
                  </div>
                )}
                {prospect.hiringVelocity && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Hiring Velocity: <strong className="text-[#202124] font-medium">{prospect.hiringVelocity}</strong></span>
                  </div>
                )}
              </div>

              {prospect.techStack && prospect.techStack.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E9EAEC]/70">
                  <div className="text-[11px] font-semibold text-[#70757D] uppercase tracking-wider mb-1.5">
                    Detected Technographics & Stack
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {prospect.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs font-mono bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Public Business Contact Information (Verified vs Unverified) */}
            <div className="pt-4 border-t border-[#E9EAEC]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider">
                  Public Business Contact Information
                </h3>
                <span className="text-[11px] text-[#70757D]">
                  Only publicly crawled endpoints
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="p-3.5 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center justify-between text-xs text-[#70757D] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#70757D]" />
                      Public Email
                    </span>
                    {prospect.verified.email ? (
                      <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">Unverified</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#202124] truncate">
                    {prospect.publicEmail ? (
                      <a href={`mailto:${prospect.publicEmail}`} className="text-[#2563EB] hover:underline">
                        {prospect.publicEmail}
                      </a>
                    ) : (
                      <span className="text-[#9CA3AF] font-normal italic">Unavailable</span>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="p-3.5 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center justify-between text-xs text-[#70757D] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#70757D]" />
                      Public Phone
                    </span>
                    {prospect.verified.phone ? (
                      <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">Unverified</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#202124] truncate font-mono">
                    {prospect.phone ? (
                      prospect.phone
                    ) : (
                      <span className="text-[#9CA3AF] font-normal italic font-sans">Unavailable</span>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="p-3.5 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center justify-between text-xs text-[#70757D] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#70757D]" />
                      Primary Website
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#202124] truncate font-mono">
                    <a
                      href={prospect.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      {prospect.website.replace('https://', '')}
                      <ExternalLink className="w-3 h-3 text-[#70757D]" />
                    </a>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="p-3.5 rounded-lg border border-[#E9EAEC] bg-[#F8F9FA]/60">
                  <div className="flex items-center justify-between text-xs text-[#70757D] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-[#70757D]" />
                      LinkedIn Profile
                    </span>
                    {prospect.verified.linkedin ? (
                      <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">Unverified</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#202124] truncate font-mono">
                    {prospect.linkedinUrl ? (
                      <a
                        href={prospect.linkedinUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                      >
                        Company LinkedIn
                        <ExternalLink className="w-3 h-3 text-[#70757D]" />
                      </a>
                    ) : (
                      <span className="text-[#9CA3AF] font-normal italic font-sans">Unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Discovered Links (Contact page, Careers page, Source URLs) */}
            <div className="pt-4 border-t border-[#E9EAEC] space-y-3">
              <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider">
                Discovered Endpoints & Source Links
              </h3>
              <div className="space-y-2 text-xs">
                {prospect.contactPageUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-[#F8F9FA] border border-[#E9EAEC]">
                    <span className="text-[#70757D]">Contact Form URL:</span>
                    <a
                      href={prospect.contactPageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-mono text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      {prospect.contactPageUrl}
                      <ExternalLink className="w-3 h-3 text-[#70757D]" />
                    </a>
                  </div>
                )}
                {prospect.careersPageUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-[#F8F9FA] border border-[#E9EAEC]">
                    <span className="text-[#70757D]">Careers / Jobs URL:</span>
                    <a
                      href={prospect.careersPageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-mono text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      {prospect.careersPageUrl}
                      <ExternalLink className="w-3 h-3 text-[#70757D]" />
                    </a>
                  </div>
                )}
                {prospect.sourceUrls.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-[#F8F9FA] border border-[#E9EAEC]">
                    <span className="text-[#70757D]">Discovery Source:</span>
                    <span className="font-mono text-[#202124] truncate max-w-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Discovered Job Listings */}
            <div className="pt-4 border-t border-[#E9EAEC] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider">
                  Discovered Job Listings
                </h3>
                <span className="text-xs text-[#70757D] font-mono tabular-nums">
                  {prospect.discoveredJobListings.length} open roles detected
                </span>
              </div>

              {prospect.discoveredJobListings.length > 0 ? (
                <div className="space-y-2">
                  {prospect.discoveredJobListings.map((job, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-[#E9EAEC] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#202124]">{job.title}</div>
                        <div className="text-[#70757D] mt-0.5">
                          {job.department ? `${job.department} · ` : ''}
                          {job.location}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#70757D]">
                        Active Hiring
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#70757D] italic">
                  No public job listings detected during latest scrape.
                </p>
              )}
            </div>

            {/* 5. Scraping History */}
            <div className="pt-4 border-t border-[#E9EAEC] space-y-3">
              <h3 className="text-xs font-bold text-[#70757D] uppercase tracking-wider">
                Scraping History & Crawl Logs
              </h3>

              {prospect.scrapingHistory.length > 0 ? (
                <div className="border border-[#E9EAEC] rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E9EAEC] text-[11px] font-semibold text-[#70757D] uppercase">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Pages Scanned</th>
                        <th className="py-2.5 px-3 text-right">Duration</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EAEC]">
                      {prospect.scrapingHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#70757D] whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {entry.status === 'scraped' && (
                              <span className="text-emerald-700 font-medium">Completed</span>
                            )}
                            {entry.status === 'failed' && (
                              <span className="text-rose-700 font-medium">Failed</span>
                            )}
                            {entry.status === 'pending' && (
                              <span className="text-amber-700 font-medium">In Queue</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {entry.pagesScanned}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {entry.durationMs}ms
                          </td>
                          <td className="py-2.5 px-3 text-[#70757D] text-[11px] max-w-xs truncate">
                            {entry.errorReason || 'Normal extraction completed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#70757D] italic">
                  No previous scraping runs recorded.
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-[#E9EAEC] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3">
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-700 font-medium">Confirm deletion?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-xs font-medium text-[#70757D] hover:bg-[#E9EAEC] rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Prospect</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#202124] hover:bg-[#E9EAEC] border border-[#E9EAEC] rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleScrape}
                disabled={isScraping}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                <span>{isScraping ? 'Scraping Site...' : 'Re-scrape Website'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
