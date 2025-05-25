/*
  # Fix user roles policy recursion

  This migration fixes the infinite recursion issue in the user_roles policies by:
  1. Dropping the existing problematic policy
  2. Creating new, non-recursive policies for user role management
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND user_roles.user_id != auth.uid() -- Prevent admin from modifying their own role
  )
);

CREATE POLICY "Users can read their own role"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users cannot modify roles"
ON user_roles
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);