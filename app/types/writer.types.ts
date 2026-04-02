export interface WriterFormData {
  full_name: string;
  pen_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  primary_languages: any;
  writing_styles: string[];
  literary_background: string;
  thematic_focus: string;
  sample_kalam: string;
  previous_publications: string;
  editorial_review_experience: boolean | null;
  willing_editorial_process: boolean | null;
  revision_acknowledged: boolean;
  institutional_acknowledged: boolean;
  profile_status?: string;
  id?: string;
  created_at?: string;
}