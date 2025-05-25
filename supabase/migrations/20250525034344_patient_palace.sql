/*
  # Update cases table RLS policies

  1. Changes
    - Modify INSERT policy to be less restrictive while maintaining data quality
    - Remove array validation that was causing issues
    - Keep basic validation for required fields
  
  2. Security
    - Maintains authentication requirement
    - Ensures basic data quality through length checks
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON cases;

-- Create new insert policy with updated validation
CREATE POLICY "Allow insert access to authenticated users"
ON cases
FOR INSERT
TO authenticated
WITH CHECK (
  -- Basic validation for required text fields
  length(title) > 0 AND
  length(accession_number) > 0 AND
  length(clinical_info) > 0 AND
  length(summary_of_pathology) > 0 AND
  -- Ensure expected_findings array exists but don't validate its contents
  expected_findings IS NOT NULL
);