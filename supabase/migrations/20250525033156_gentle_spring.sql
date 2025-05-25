/*
  # Create cases table

  1. New Tables
    - `cases`
      - `id` (uuid, primary key)
      - `title` (text)
      - `accession_number` (text)
      - `clinical_info` (text)
      - `expected_findings` (text[])
      - `additional_findings` (text[])
      - `summary_of_pathology` (text)
      - `images` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed` (boolean)

  2. Security
    - Enable RLS on `cases` table
    - Add policies for authenticated users to:
      - Read all cases
      - Create new cases
      - Update their own cases
      - Delete their own cases
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  accession_number text NOT NULL,
  clinical_info text NOT NULL,
  expected_findings text[] NOT NULL DEFAULT '{}',
  additional_findings text[] NOT NULL DEFAULT '{}',
  summary_of_pathology text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to all cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to authenticated users"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users"
  ON cases
  FOR DELETE
  TO authenticated
  USING (true);