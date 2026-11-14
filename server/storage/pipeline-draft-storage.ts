import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  PipelineDraft,
  AudioAssemblyEDL,
  VariantSource,
  AssemblyRevisionRecord,
  ReconciledMasterTimeline,
} from '@/server/types/pipeline-draft';

const BASE_DATA_DIR = path.join(process.cwd(), '.data', 'pipeline-drafts');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getDraftDir(draftId: string): string {
  return path.join(BASE_DATA_DIR, draftId);
}

function getDraftJsonPath(draftId: string): string {
  return path.join(getDraftDir(draftId), 'draft.json');
}

export function getDraftAudioDir(draftId: string): string {
  const dir = path.join(getDraftDir(draftId), 'audio');
  ensureDir(dir);
  return dir;
}

export function computeFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export const pipelineDraftStorage = {
  createDraft(params: {
    title: string;
    slug?: string;
    lyricsText?: string;
    primaryLanguage?: string;
  }): PipelineDraft {
    ensureDir(BASE_DATA_DIR);
    const draftId = `draft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const slug = (params.slug || params.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `release-${draftId}`;

    const now = new Date().toISOString();
    const draft: PipelineDraft = {
      draftId,
      slug,
      title: params.title.trim(),
      primaryLanguage: params.primaryLanguage || 'ur',
      availableLanguages: ['ur', 'en', 'en-rom', 'hi'],
      canonicalLyrics: {
        text: params.lyricsText || '',
        language: params.primaryLanguage || 'ur',
        status: 'DRAFT',
      },
      variants: {},
      activeVariantId: '',
      assembly: {
        version: 1,
        updatedAt: now,
        segments: [],
      },
      currentRevision: 1,
      assemblyRevisions: [],
      masterAudio: null,
      masterTimeline: null,
      stems: {
        hasSeparateStems: false,
      },
      qualityAnomalies: [],
      downstreamStatus: {
        timestampsValid: false,
        subtitlesValid: false,
        videoValid: false,
        approvalStatus: 'draft',
      },
      publishingTx: null,
      createdAt: now,
      updatedAt: now,
    };

    this.saveDraft(draft);
    return draft;
  },

  getDraft(draftId: string): PipelineDraft | null {
    const jsonPath = getDraftJsonPath(draftId);
    if (!fs.existsSync(jsonPath)) return null;

    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(raw) as PipelineDraft;
    } catch (err) {
      console.error(`[pipelineDraftStorage] Error reading draft ${draftId}:`, err);
      return null;
    }
  },

  saveDraft(draft: PipelineDraft): void {
    const draftDir = getDraftDir(draft.draftId);
    ensureDir(draftDir);

    draft.updatedAt = new Date().toISOString();
    const targetPath = getDraftJsonPath(draft.draftId);
    const tmpPath = `${targetPath}.tmp_${Date.now()}`;

    fs.writeFileSync(tmpPath, JSON.stringify(draft, null, 2), 'utf8');
    fs.renameSync(tmpPath, targetPath);
  },

  listDrafts(): PipelineDraft[] {
    ensureDir(BASE_DATA_DIR);
    const dirs = fs.readdirSync(BASE_DATA_DIR);
    const drafts: PipelineDraft[] = [];

    for (const dir of dirs) {
      const draftPath = path.join(BASE_DATA_DIR, dir, 'draft.json');
      if (fs.existsSync(draftPath)) {
        try {
          const raw = fs.readFileSync(draftPath, 'utf8');
          drafts.push(JSON.parse(raw));
        } catch {}
      }
    }

    return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  addVariant(draftId: string, variant: VariantSource): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    draft.variants[variant.variantId] = variant;
    if (!draft.activeVariantId) {
      draft.activeVariantId = variant.variantId;
    }

    // If assembly is empty, seed it with this initial variant
    if (draft.assembly.segments.length === 0) {
      draft.assembly.segments = [
        {
          segmentId: `seg_1_${variant.variantId}`,
          sourceVariantId: variant.variantId,
          sourceInSeconds: 0,
          sourceOutSeconds: variant.durationSeconds,
          destinationStartSeconds: 0,
          transition: { type: 'cut' },
          trackType: 'full_mix',
          enabled: true,
        },
      ];
      draft.assembly.updatedAt = new Date().toISOString();
    }

    this.saveDraft(draft);
    return draft;
  },

  updateAssembly(
    draftId: string,
    newEDL: AudioAssemblyEDL,
    changeNote: string = 'Assembly updated'
  ): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const now = new Date().toISOString();

    // Snapshot current revision for rollback
    const revisionRecord: AssemblyRevisionRecord = {
      revision: draft.currentRevision,
      updatedAt: now,
      changeNote,
      edl: JSON.parse(JSON.stringify(draft.assembly)),
      timelineSnapshot: draft.masterTimeline ? JSON.parse(JSON.stringify(draft.masterTimeline)) : undefined,
      masterWavPath: draft.masterAudio?.filePath,
      masterDurationSeconds: draft.masterAudio?.durationSeconds,
      masterSha256: draft.masterAudio?.sha256,
    };

    draft.assemblyRevisions.push(revisionRecord);
    draft.currentRevision += 1;
    newEDL.version = draft.currentRevision;
    newEDL.updatedAt = now;
    draft.assembly = newEDL;

    // INVARIATION CASCADE: Invalidate all downstream dependent assets
    draft.masterAudio = null;
    draft.masterTimeline = null;
    draft.downstreamStatus.timestampsValid = false;
    draft.downstreamStatus.subtitlesValid = false;
    draft.downstreamStatus.videoValid = false;
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    this.saveDraft(draft);
    return draft;
  },

  rollbackAssembly(draftId: string, targetRevision: number): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const target = draft.assemblyRevisions.find((r) => r.revision === targetRevision);
    if (!target) throw new Error(`Revision ${targetRevision} not found`);

    const now = new Date().toISOString();

    // Snapshot current before rolling back
    draft.assemblyRevisions.push({
      revision: draft.currentRevision,
      updatedAt: now,
      changeNote: `Rollback to revision ${targetRevision}`,
      edl: JSON.parse(JSON.stringify(draft.assembly)),
      timelineSnapshot: draft.masterTimeline ? JSON.parse(JSON.stringify(draft.masterTimeline)) : undefined,
      masterWavPath: draft.masterAudio?.filePath,
      masterDurationSeconds: draft.masterAudio?.durationSeconds,
      masterSha256: draft.masterAudio?.sha256,
    });

    draft.currentRevision += 1;
    draft.assembly = {
      ...JSON.parse(JSON.stringify(target.edl)),
      version: draft.currentRevision,
      updatedAt: now,
    };

    if (target.timelineSnapshot) {
      draft.masterTimeline = JSON.parse(JSON.stringify(target.timelineSnapshot));
      draft.downstreamStatus.timestampsValid = true;
    } else {
      draft.masterTimeline = null;
      draft.downstreamStatus.timestampsValid = false;
    }

    if (target.masterWavPath && fs.existsSync(target.masterWavPath)) {
      draft.masterAudio = {
        format: 'wav',
        sampleRate: 48000,
        bitDepth: 16,
        channels: 2,
        durationSeconds: target.masterDurationSeconds || 0,
        filePath: target.masterWavPath,
        sha256: target.masterSha256 || computeFileSha256(target.masterWavPath),
        renderedAt: now,
      };
    } else {
      draft.masterAudio = null;
    }

    draft.downstreamStatus.subtitlesValid = false;
    draft.downstreamStatus.videoValid = false;
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    this.saveDraft(draft);
    return draft;
  },

  commitMasterRender(
    draftId: string,
    masterWavPath: string,
    durationSeconds: number,
    timeline: ReconciledMasterTimeline
  ): PipelineDraft {
    const draft = this.getDraft(draftId);
    if (!draft) throw new Error(`Draft ${draftId} not found`);

    const now = new Date().toISOString();
    draft.masterAudio = {
      format: 'wav',
      sampleRate: 48000,
      bitDepth: 16,
      channels: 2,
      durationSeconds,
      filePath: masterWavPath,
      sha256: computeFileSha256(masterWavPath),
      renderedAt: now,
    };

    draft.masterTimeline = timeline;
    draft.downstreamStatus.timestampsValid = true;
    draft.downstreamStatus.approvalStatus = 'assembly_pending_review';

    this.saveDraft(draft);
    return draft;
  },
};
