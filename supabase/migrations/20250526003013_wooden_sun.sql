/*
  # Add delete_case_with_dependencies function

  1. New Function
    - Creates a PostgreSQL function to safely delete a case and all its dependencies
    - Handles deletion in the correct order to avoid foreign key violations
    - Deletes from case_completion and user_progress before deleting the case

  2. Security
    - Function is accessible only to authenticated users
    - Checks if the user has admin role before proceeding
*/

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
  WHERE case_id = $1;

  -- Delete user_progress records
  DELETE FROM user_progress
  WHERE case_id = $1;

  -- Finally, delete the case itself
  DELETE FROM cases
  WHERE id = $1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_case_with_dependencies TO authenticated;