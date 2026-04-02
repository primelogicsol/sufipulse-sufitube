export interface LiteraryProfileType {
  full_name: string;
  professional_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  writing_focus: string[];
  languages: string | string[];
  background: string;
  portfolio_link: string;
  worked_editorial_process: boolean | null;
  willing_review_process: boolean | null;
  acknowledge_editorial_control: boolean;
  accept_framework: boolean;
  profile_status?: string;
}
