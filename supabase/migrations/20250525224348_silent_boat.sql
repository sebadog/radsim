/*
  # Set admin user

  1. Changes
    - Sets sebadog@gmail.com as an admin user
    - Updates existing role or creates new role entry if none exists
  
  2. Security
    - Only affects the specified user
    - Maintains existing RLS policies
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID for sebadog@gmail.com
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'sebadog@gmail.com';

  -- If user exists, update their role to admin
  IF target_user_id IS NOT NULL THEN
    -- Update existing role if it exists
    UPDATE user_roles
    SET role = 'admin'
    WHERE user_id = target_user_id;
    
    -- Insert new role if it doesn't exist
    INSERT INTO user_roles (user_id, role)
    SELECT target_user_id, 'admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = target_user_id
    );
  END IF;
END $$;