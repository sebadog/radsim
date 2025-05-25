/*
  # Update case policies for admin-only access

  1. Changes
    - Drop existing case policies
    - Create new explicit policies for admin-only access
    - Ensure regular users can only read cases
  
  2. Security
    - Only admins can create, update, and delete cases
    - All users (including unauthenticated) can read cases
    - Regular users cannot modify cases in any way
*/

-- Drop existing case policies
DROP POLICY IF EXISTS "Anyone can read cases" ON cases;
DROP POLICY IF EXISTS "Admins can create cases" ON cases;
DROP POLICY IF EXISTS "Admins can update cases" ON cases;
DROP POLICY IF EXISTS "Admins can delete cases" ON cases;

-- Create new policies with explicit permissions

-- Allow anyone to read cases (including unauthenticated users)
CREATE POLICY "Enable read access for all users"
  ON cases
  FOR SELECT
  TO public
  USING (true);

-- Only admins can create new cases
CREATE POLICY "Enable admin create access"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update cases
CREATE POLICY "Enable admin update access"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete cases
CREATE POLICY "Enable admin delete access"
  ON cases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );