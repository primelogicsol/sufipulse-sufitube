/**
 * server/services/kashmir-partner-store.ts
 *
 * Persistent storage and management for the SufiPulse Kashmir Partner Network.
 * Handles partner registry, district segmentation, publication records, and telemetry attribution.
 */

import fs from 'node:fs';
import path from 'node:path';
import { KashmirPartner, PartnerPillar, KashmirDistrict } from '@/server/types/kashmir-reach';
import { logger } from '@/app/lib/logger';

const DATA_DIR = path.join(process.cwd(), '.data');
const PARTNERS_FILE = path.join(DATA_DIR, 'kashmir-partners.json');
const SEED_FILE = path.join(process.cwd(), 'lib', 'kashmir-partner-seed.json');

class KashmirPartnerStore {
  private partners: KashmirPartner[] = [];
  private initialized = false;
  private lastMtime: number = 0;

  private ensureInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(PARTNERS_FILE)) {
        const stat = fs.statSync(PARTNERS_FILE);
        if (!this.initialized || stat.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(PARTNERS_FILE, 'utf8');
          this.partners = JSON.parse(raw);
          this.lastMtime = stat.mtimeMs;
          this.initialized = true;
        }
      } else if (fs.existsSync(SEED_FILE)) {
        const seedRaw = fs.readFileSync(SEED_FILE, 'utf8');
        this.partners = JSON.parse(seedRaw);
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(this.partners, null, 2), 'utf8');
        const stat = fs.statSync(PARTNERS_FILE);
        this.lastMtime = stat.mtimeMs;
        this.initialized = true;
      } else {
        this.partners = [];
        this.initialized = true;
      }
    } catch (err: any) {
      logger.cms.error('[KashmirPartnerStore] Failed to initialize store', { error: err.message });
      if (!this.initialized) {
        this.partners = [];
        this.initialized = true;
      }
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PARTNERS_FILE, JSON.stringify(this.partners, null, 2), 'utf8');
      const stat = fs.statSync(PARTNERS_FILE);
      this.lastMtime = stat.mtimeMs;
    } catch (err: any) {
      logger.cms.error('[KashmirPartnerStore] Failed to persist data', { error: err.message });
    }
  }

  public getAll(): KashmirPartner[] {
    this.ensureInitialized();
    return [...this.partners];
  }

  public getById(id: string): KashmirPartner | undefined {
    this.ensureInitialized();
    return this.partners.find((p) => p.id === id);
  }

  public getByTrackingCode(code: string): KashmirPartner | undefined {
    this.ensureInitialized();
    return this.partners.find((p) => p.trackingCode.toLowerCase() === code.toLowerCase().trim());
  }

  public filter(criteria: {
    pillar?: PartnerPillar;
    district?: KashmirDistrict;
    status?: string;
    searchQuery?: string;
  }): KashmirPartner[] {
    this.ensureInitialized();
    let result = this.partners;

    if (criteria.pillar && criteria.pillar !== ('all' as any)) {
      result = result.filter((p) => p.pillar === criteria.pillar);
    }
    if (criteria.district && criteria.district !== ('all' as any)) {
      result = result.filter((p) => p.district === criteria.district);
    }
    if (criteria.status && criteria.status !== ('all' as any)) {
      result = result.filter((p) => p.verificationStatus === criteria.status);
    }
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.primaryHandle.toLowerCase().includes(q) ||
          p.contactPerson.toLowerCase().includes(q) ||
          p.locationDetails.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public matchForRelease(slug: string, themes: string[] = []): KashmirPartner[] {
    this.ensureInitialized();
    const verified = this.partners.filter((p) => p.verificationStatus === 'verified');
    if (themes.length === 0) {
      // Release specific defaults
      if (slug.includes('silent') || slug.includes('khamosh')) {
        return verified.filter((p) => p.pillar === 'ecological_conservation' || p.pillar === 'youth_academic_thinkers');
      }
      if (slug.includes('footprints')) {
        return verified.filter((p) => p.pillar === 'artisan_craft_heritage' || p.pillar === 'youth_academic_thinkers');
      }
      return verified;
    }

    return verified.filter((p) =>
      p.matchedReleaseThemes.some((t) => themes.includes(t)) ||
      themes.some((t) => p.matchedReleaseThemes.includes(t))
    );
  }

  public save(partner: Partial<KashmirPartner>): KashmirPartner {
    this.ensureInitialized();
    const now = new Date().toISOString();

    if (partner.id) {
      const idx = this.partners.findIndex((p) => p.id === partner.id);
      if (idx >= 0) {
        this.partners[idx] = {
          ...this.partners[idx],
          ...partner,
          updatedAt: now,
        };
        this.persist();
        return this.partners[idx];
      }
    }

    // New partner
    const newId = partner.id || `kpn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPartner: KashmirPartner = {
      id: newId,
      name: partner.name || 'New Community Partner',
      slug: partner.slug || partner.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || newId,
      organizationType: partner.organizationType || 'cultural_society',
      pillar: partner.pillar || 'sacred_literature_sufi',
      district: partner.district || 'srinagar',
      locationDetails: partner.locationDetails || 'Kashmir Valley',
      authorizedChannels: partner.authorizedChannels || ['whatsapp', 'instagram'],
      primaryHandle: partner.primaryHandle || '',
      contactPerson: partner.contactPerson || '',
      contactChannel: partner.contactChannel || 'whatsapp',
      contactValue: partner.contactValue || '',
      verificationStatus: partner.verificationStatus || 'pending_verification',
      verificationNotes: partner.verificationNotes,
      verifiedAt: partner.verificationStatus === 'verified' ? now : undefined,
      consentStatus: partner.consentStatus || 'permission_pending',
      estimatedCommunityReach: partner.estimatedCommunityReach || 5000,
      relationshipType: partner.relationshipType || 'independent_partner',
      geographicConfidence: partner.geographicConfidence || 'high_valley_verified',
      trackingCode: partner.trackingCode || newId.replace('kpn_', ''),
      matchedReleaseThemes: partner.matchedReleaseThemes || [],
      metrics: {
        campaignsReceived: 0,
        campaignsAccepted: 0,
        publishedUrls: [],
        totalReferralClicks: 0,
        engagedListens: 0,
        completedListens: 0,
      },
      notes: partner.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    this.partners.push(newPartner);
    this.persist();
    return newPartner;
  }

  public verify(partnerId: string, notes?: string, verifiedBy?: string): boolean {
    this.ensureInitialized();
    const partner = this.partners.find((p) => p.id === partnerId);
    if (!partner) return false;
    partner.verificationStatus = 'verified';
    partner.verifiedAt = new Date().toISOString();
    partner.consentStatus = 'explicit_permission_granted';
    if (notes) partner.verificationNotes = notes;
    if (verifiedBy) partner.verifiedBy = verifiedBy;
    partner.updatedAt = new Date().toISOString();
    this.persist();
    logger.cms.info('[KPN Audit] Partner application approved & verified by administrator', {
      partnerId,
      partnerName: partner.name,
      verifiedBy: verifiedBy || 'admin',
      timestamp: partner.verifiedAt,
    });
    return true;
  }

  public reject(partnerId: string, rejectedBy?: string): boolean {
    this.ensureInitialized();
    const idx = this.partners.findIndex((p) => p.id === partnerId);
    if (idx < 0) return false;
    const partner = this.partners[idx];
    this.partners.splice(idx, 1);
    this.persist();
    logger.cms.info('[KPN Audit] Partner application dismissed by administrator', {
      partnerId,
      partnerName: partner.name,
      rejectedBy: rejectedBy || 'admin',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  public recordPublication(
    partnerId: string,
    record: { releaseSlug: string; channel: any; publishedUrl: string }
  ): boolean {
    this.ensureInitialized();
    const partner = this.partners.find((p) => p.id === partnerId);
    if (!partner) return false;

    const newRecord = {
      id: `pub_${Date.now()}`,
      releaseSlug: record.releaseSlug,
      channel: record.channel,
      publishedUrl: record.publishedUrl,
      reportedAt: new Date().toISOString(),
      verifiedByAdmin: true,
    };

    partner.metrics.publishedUrls.push(newRecord);
    partner.metrics.campaignsAccepted += 1;
    partner.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  public recordAttribution(
    trackingCode: string,
    metric: 'click' | 'engaged' | 'complete'
  ): boolean {
    this.ensureInitialized();
    const partner = this.getByTrackingCode(trackingCode);
    if (!partner) return false;

    const now = new Date().toISOString();
    partner.metrics.lastAttributedVisitAt = now;

    if (metric === 'click') {
      partner.metrics.totalReferralClicks += 1;
    } else if (metric === 'engaged') {
      partner.metrics.engagedListens += 1;
    } else if (metric === 'complete') {
      partner.metrics.completedListens += 1;
    }

    this.persist();
    return true;
  }

  public getStats() {
    this.ensureInitialized();
    const total = this.partners.length;
    const verified = this.partners.filter((p) => p.verificationStatus === 'verified').length;
    const totalReach = this.partners
      .filter((p) => p.verificationStatus === 'verified')
      .reduce((acc, p) => acc + (p.estimatedCommunityReach || 0), 0);

    const districtsCovered = new Set(this.partners.filter((p) => p.verificationStatus === 'verified').map((p) => p.district)).size;

    const totalClicks = this.partners.reduce((acc, p) => acc + (p.metrics.totalReferralClicks || 0), 0);
    const totalEngaged = this.partners.reduce((acc, p) => acc + (p.metrics.engagedListens || 0), 0);
    const totalCompleted = this.partners.reduce((acc, p) => acc + (p.metrics.completedListens || 0), 0);

    // Distribution by district
    const byDistrict: Record<string, { partnerCount: number; estimatedReach: number; clicks: number }> = {};
    for (const p of this.partners) {
      if (!byDistrict[p.district]) {
        byDistrict[p.district] = { partnerCount: 0, estimatedReach: 0, clicks: 0 };
      }
      byDistrict[p.district].partnerCount += 1;
      byDistrict[p.district].estimatedReach += p.estimatedCommunityReach || 0;
      byDistrict[p.district].clicks += p.metrics.totalReferralClicks || 0;
    }

    // Distribution by pillar
    const byPillar: Record<string, number> = {
      ecological_conservation: 0,
      artisan_craft_heritage: 0,
      sacred_literature_sufi: 0,
      youth_academic_thinkers: 0,
    };
    for (const p of this.partners) {
      if (byPillar[p.pillar] !== undefined) {
        byPillar[p.pillar] += 1;
      }
    }

    return {
      totalPartners: total,
      verifiedPartners: verified,
      pendingPartners: total - verified,
      totalEstimatedReach: totalReach,
      districtsCovered,
      totalClicks,
      totalEngaged,
      totalCompleted,
      byDistrict,
      byPillar,
    };
  }
}

export const kashmirPartnerStore = new KashmirPartnerStore();
