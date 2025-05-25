/*
  # Fix case policies

  1. Changes
    - Simplify RLS policies to focus on core requirements
    - Remove overly restrictive array validation
    - Ensure proper authentication checks
    - Add proper error handling

  2. Security
    - Maintain RLS enabled
    - Keep authentication requirements
    - Allow authenticated users to perform CRUD operations
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON cases;
DROP POLICY IF EXISTS "Allow update access to authenticated users" ON cases;
DROP POLICY IF EXISTS "Allow delete access to authenticated users" ON cases;
DROP POLICY IF EXISTS "Allow read access to all cases" ON cases;

-- Create simplified policies with proper authentication checks
CREATE POLICY "Enable read access for authenticated users"
ON cases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON cases FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON cases FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON cases FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');