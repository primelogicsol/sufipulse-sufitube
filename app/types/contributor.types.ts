export type PerformanceStatus = 
    | 'assigned' 
    | 'pre-production' 
    | 'recording' 
    | 'raw_vocals_received' 
    | 'mixing' 
    | 'mastering' 
    | 'published';

export interface PerformanceAssignment {
    id: string;
    referenceId: string;
    kalam_id: string;
    kalam_title: string;
    kalam_content: string;
    status: PerformanceStatus;
    assigned_at: string;
    producer_notes?: string;
    technical_guidelines?: string;
}

export type WriterProfileStatus = 'pending_review' | 'under_review' | 'revision_requested' | 'approved' | 'approved_as_writer' | 'archived';

export interface WriterProfileType {
    id: string;
    user_id?: string;
    full_name: string;
    pen_name?: string;
    email: string;
    country: string;
    profile_status: WriterProfileStatus;
    submitted_at: string;
    referenceId?: string;
    trackingToken?: string;
}

export interface KalamUnderDraft {
    id: string;
    title: string;
    content: string;
    originality_confirmed: boolean;
    rights_confirmed: boolean;
    governance_acknowledged: boolean;
    status: 'draft' | 'pending_review' | 'under_editorial_review' | 'revision_requested' | 'approved' | 'not_advanced' | 'pre_allocated';
    submitted_at?: string;
    updated_at?: string;
    referenceId?: string;
}
