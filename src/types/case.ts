export interface Case {
  id: string;
  title: string;
  accession_number: string;
  clinical_info: string;
  expected_findings: string[];
  additional_findings: string[];
  summary_of_pathology: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
  completed?: boolean;
  completed_at?: string | null;
  survey_url?: string;
}