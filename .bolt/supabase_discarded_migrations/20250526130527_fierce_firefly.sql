/*
  # Remove summary_of_pathology column
  
  1. Changes
    - Remove summary_of_pathology column from cases table as it's no longer needed
*/

ALTER TABLE cases DROP COLUMN IF EXISTS summary_of_pathology;