/*
  # Update RLS policies with validation

  1. Changes
    - Add WITH CHECK validation for INSERT policy to ensure required fields are not empty
    - Add WITH CHECK validation for UPDATE policy to ensure required fields are not empty when modified
  
  2. Security
    - Maintains existing RLS enabled status
    - Updates policies to enforce data validation
    - Ensures authenticated users can only insert/update valid data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON cases;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON cases;

-- Create new INSERT policy with validation
CREATE POLICY "Allow insert access to authenticated users"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure required text fields are not empty
    length(title) > 0 AND
    length(accession_number) > 0 AND
    length(clinical_info) > 0 AND
    length(summary_of_pathology) > 0 AND
    -- Ensure arrays are not empty
    array_length(expected_findings, 1) > 0 AND
    -- Ensure array elements are not empty strings
    NOT (expected_findings && ARRAY[''])
  );

-- Create new UPDATE policy with validation
CREATE POLICY "Allow update access to authenticated users"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Ensure required text fields are not empty if being updated
    (title IS NULL OR length(title) > 0) AND
    (accession_number IS NULL OR length(accession_number) > 0) AND
    (clinical_info IS NULL OR length(clinical_info) > 0) AND
    (summary_of_pathology IS NULL OR length(summary_of_pathology) > 0) AND
    -- Ensure arrays are not empty if being updated
    (expected_findings IS NULL OR array_length(expected_findings, 1) > 0) AND
    -- Ensure array elements are not empty strings
    (expected_findings IS NULL OR NOT (expected_findings && ARRAY['']))
  );