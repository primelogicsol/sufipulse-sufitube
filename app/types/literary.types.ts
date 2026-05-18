export type LiteraryStatus = 
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved_for_journal'
  | 'published_in_journal'
  | 'rejected'
  | 'archived';

export interface LiteraryProfileType {
  full_name: string;
  pen_name?: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  primary_languages: string[];
  writing_forms: string[];
  areas_of_interest: string[];
  writing_sample_link: string;
  short_bio: string;
  publication_intent: string;
  acknowledge_editorial_control: boolean;
  accept_framework: boolean;
  profile_status?: LiteraryStatus;
  submitted_at?: string;
  updated_at?: string;
}
