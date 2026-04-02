export interface VocalistProfileType {
  full_name: string;
  performance_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  vocal_range: string;
  performance_styles: string[];
  languages_performed: any;
  musical_training: string;
  sample_link: string;
  worked_in_studio: boolean | null;
  willing_editorial_approval: boolean | null;
  accept_producer_coordination: boolean;
  accept_framework: boolean;
  status?: string;
  id?: string | undefined;
}