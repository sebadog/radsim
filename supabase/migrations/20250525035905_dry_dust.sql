/*
  # Remove authentication requirement for cases table

  1. Changes
    - Drop existing RLS policies that require authentication
    - Create new policies that allow public access for all operations
    - Keep RLS enabled for future use if needed

  2. Security Note
    - This migration removes authentication requirements
    - All operations (read/write) will be allowed without authentication
    - Consider adding rate limiting or other security measures if needed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON cases;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON cases;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON cases;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON cases;

-- Create new policies that allow public access
CREATE POLICY "Enable public read access"
ON cases FOR SELECT
USING (true);

CREATE POLICY "Enable public insert access"
ON cases FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable public update access"
ON cases FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public delete access"
ON cases FOR DELETE
USING (true);