import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Error resetting password:', error.message);
    throw new Error(error.message);
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('Error updating password:', error.message);
    throw new Error(error.message);
  }
}

export async function signUp(email: string, password: string): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error signing up:', error.message);
    throw new Error(error.message);
  }

  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    role: 'user' // New users are always regular users by default
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error.message);
    throw new Error(error.message);
  }

  if (!user) return null;

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    role: roleData?.role || 'user'
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    role: roleData?.role || 'user'
  };
}

export async function updateUserProgress(caseId: string, data: {
  completed?: boolean;
  first_attempt?: string;
  second_attempt?: string;
  score?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      case_id: caseId,
      ...data,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating progress:', error);
    throw new Error(error.message);
  }
}

export async function getUserProgress(caseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('case_id', caseId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching progress:', error);
    throw new Error(error.message);
  }

  return data;
}