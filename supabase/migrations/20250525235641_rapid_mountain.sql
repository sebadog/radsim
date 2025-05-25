/*
  # Add case completion tracking

  1. New Tables
    - `case_completion`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `case_id` (uuid, references cases)
      - `completed` (boolean)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on `case_completion` table
    - Add policies for users to manage their own completion status
*/

CREATE TABLE IF NOT EXISTS case_completion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  case_id uuid REFERENCES cases NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, case_id)
);

ALTER TABLE case_completion ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own completion status
CREATE POLICY "Users can read own completion status"
  ON case_completion
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own completion status
CREATE POLICY "Users can insert own completion status"
  ON case_completion
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own completion status
CREATE POLICY "Users can update own completion status"
  ON case_completion
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);