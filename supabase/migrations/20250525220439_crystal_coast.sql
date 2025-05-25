/*
  # Remove diagnosis field
  
  1. Changes
    - Drop diagnosis column from cases table
*/

ALTER TABLE cases DROP COLUMN IF EXISTS diagnosis;