/*
  # Add case links and survey URLs

  1. Changes
    - Add `case_number` column to cases table
    - Add `survey_url` column to cases table
    - Add `diagnosis` column to cases table
    - Update images array to use the provided image URLs
    - Add sample data for the 5 cases

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS case_number INTEGER,
ADD COLUMN IF NOT EXISTS survey_url TEXT,
ADD COLUMN IF NOT EXISTS diagnosis TEXT;

-- Insert sample cases
INSERT INTO cases (
  title,
  case_number,
  diagnosis,
  images,
  survey_url,
  accession_number,
  clinical_info,
  expected_findings,
  additional_findings,
  summary_of_pathology,
  completed
) VALUES 
(
  'Case 1: Sacral Insufficiency Fracture',
  1,
  'Sacral insufficiency fracture',
  ARRAY['https://tinyurl.com/3trfp9hy'],
  'https://www.surveymonkey.com/r/6BHFZWZ',
  'ACC001',
  'Patient presents with lower back pain',
  ARRAY['Sacral insufficiency fracture'],
  ARRAY[]::text[],
  'Sacral insufficiency fracture with characteristic H-sign on imaging',
  false
),
(
  'Case 2: Cervical Spine Fracture',
  2,
  'C5-C6 trans discal fracture',
  ARRAY['https://tinyurl.com/yc3dpsn8'],
  'https://www.surveymonkey.com/r/QZ7KHWW',
  'ACC002',
  'Patient presents after trauma',
  ARRAY['C5-C6 trans discal fracture'],
  ARRAY[]::text[],
  'Trans discal fracture at C5-C6 level',
  false
),
(
  'Case 3: Vertebral Fractures with Renal Mass',
  3,
  'L2-L3 vertebral fractures and left renal mass (presumed RCC)',
  ARRAY['https://tinyurl.com/bdduyanp'],
  'https://www.surveymonkey.com/r/QZ6W78L',
  'ACC003',
  'Patient presents with back pain and incidental finding',
  ARRAY['L2-L3 vertebral fractures', 'Left renal mass consistent with RCC'],
  ARRAY[]::text[],
  'Multiple findings including vertebral fractures and renal mass',
  false
),
(
  'Case 4: Sinonasal Pathology',
  4,
  'Sinonasal mass',
  ARRAY['https://tinyurl.com/ss2fbanz'],
  'https://www.surveymonkey.com/r/2NFPMDD',
  'ACC004',
  'Patient presents with nasal symptoms',
  ARRAY['Sinonasal mass'],
  ARRAY[]::text[],
  'Mass lesion in the sinonasal region',
  false
),
(
  'Case 5: MSA-P Case',
  5,
  'MSA-P (putaminal rim sign)',
  ARRAY['https://tinyurl.com/2rcrc2vr'],
  'https://www.surveymonkey.com/r/2FRD39D',
  'ACC005',
  'Patient presents with parkinsonian symptoms',
  ARRAY['Putaminal rim sign consistent with MSA-P'],
  ARRAY[]::text[],
  'Imaging findings consistent with Multiple System Atrophy - Parkinsonian type',
  false
);