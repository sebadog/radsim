-- Set sebadog@gmail.com as admin
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID for sebadog@gmail.com
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'sebadog@gmail.com';

  -- If user exists, update their role to admin
  IF user_id IS NOT NULL THEN
    UPDATE user_roles
    SET role = 'admin'
    WHERE user_id = user_id;
    
    -- If no role exists yet, insert one
    INSERT INTO user_roles (user_id, role)
    SELECT user_id, 'admin'
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = user_id
    );
  END IF;
END $$;