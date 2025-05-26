CREATE OR REPLACE FUNCTION delete_case_with_dependencies(case_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete cases';
  END IF;

  -- Delete case_completion records
  DELETE FROM case_completion
  WHERE case_completion.case_id = $1;

  -- Delete user_progress records
  DELETE FROM user_progress
  WHERE user_progress.case_id = $1;

  -- Finally, delete the case itself
  DELETE FROM cases
  WHERE cases.id = $1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_case_with_dependencies TO authenticated;