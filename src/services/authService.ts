import { createClient, User, AuthError, Session } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
);

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/update`,
    });

    if (error) throw error;
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  try {
    const { data: { user, session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`
      }
    });

    if (error) throw error;
    if (!user) throw new AuthenticationError('No user data returned');

    // User is created with 'user' role by default through the database trigger
    return {
      id: user.id,
      email: user.email!,
      role: 'user'
    };
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!user) throw new AuthenticationError('No user data returned');

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) throw roleError;

    return {
      id: user.id,
      email: user.email!,
      role: roleData?.role || 'user'
    };
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session?.user) return null;

    const user = session.user;

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError && roleError.code !== 'PGRST116') throw roleError;

    return {
      id: user.id,
      email: user.email!,
      role: roleData?.role || 'user'
    };
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

// Session management
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }

    if (session?.user) {
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        callback({
          id: session.user.id,
          email: session.user.email!,
          role: roleData?.role || 'user'
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  }).data.subscription.unsubscribe;
}

// User progress tracking
export async function updateUserProgress(caseId: string, data: {
  completed?: boolean;
  first_attempt?: string;
  second_attempt?: string;
  score?: number;
}): Promise<void> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) throw new AuthenticationError('No authenticated user');

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: session.user.id,
        case_id: caseId,
        ...data,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}

export async function getUserProgress(caseId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('case_id', caseId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  } catch (error) {
    const authError = error as AuthError;
    throw new AuthenticationError(
      authError.message,
      authError.status?.toString()
    );
  }
}