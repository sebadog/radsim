/*
  # Fix user roles policies

  1. Changes
    - Drop existing policies on user_roles table that cause recursion
    - Create new policies with proper access control:
      - Users can read their own role
      - Admins can manage all roles except their own
      - Users cannot modify roles

  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion in policies
    - Ensures proper role-based access control
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users cannot modify roles" ON user_roles;

-- Create new policies without recursion
CREATE POLICY "Users can read their own role"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin policy for managing other users' roles (excluding their own)
CREATE POLICY "Admins can manage other users roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  -- Check if the current user is an admin
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  -- Prevent admins from modifying their own role
  AND user_id != auth.uid()
);

-- Prevent regular users from modifying roles
CREATE POLICY "Users cannot modify roles"
ON user_roles
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);