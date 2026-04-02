export interface ProducerProfileType {
  full_name: string;
  professional_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  primary_production_focus: string[];
  primary_tools: string;
  musical_background: string;
  portfolio_link: string;
  worked_structured_production: boolean | null;
  willing_defined_sequence: boolean | null;
  acknowledge_centralized_control: boolean;
  accept_framework: boolean;
  profile_status?: string;
  id?: string;
  created_at?: string;
}
