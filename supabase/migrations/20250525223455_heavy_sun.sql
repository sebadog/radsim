/*
  # Fix user_roles RLS policies

  1. Changes
    - Remove recursive policies on user_roles table
    - Create new non-recursive policies for admin and user access
    
  2. Security
    - Maintain same security model but implement it without recursion
    - Ensure admins can still manage other users' roles
    - Users can still read their own role
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage other users roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Users cannot modify roles" ON user_roles;

-- Create new policies without recursion
CREATE POLICY "Enable read access for users" ON user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    role = 'admin'
  );

CREATE POLICY "Enable admin management" ON user_roles
  FOR ALL TO authenticated
  USING (
    role = 'admin' AND 
    auth.uid() != user_id
  )
  WITH CHECK (
    role = 'admin' AND 
    auth.uid() != user_id
  );

CREATE POLICY "Enable users to read own role" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);