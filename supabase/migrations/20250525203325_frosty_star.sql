/*
  # Remove case number column
  
  This migration removes the case_number column from the cases table as it's no longer needed.
  
  Changes:
  - Drop case_number column from cases table
*/

ALTER TABLE cases DROP COLUMN IF EXISTS case_number;