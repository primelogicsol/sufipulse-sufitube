export interface StudioProfileType {
  studio_name: string;
  country: string;
  city: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  years_in_operation: string;
  previous_work_link: string;
  agree_centralized_validation: boolean | null;
  agree_centralized_authorization: boolean | null;
  recording_capabilities: string[];
  equipment_overview: string;
  accept_terms: boolean;
  profile_status?: string;
}
