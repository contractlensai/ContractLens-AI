import { supabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  joinedAt: string;
}

export const authService = {
  async signup(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data.user;
  },

  async login(email: string, password: string, rememberMe?: boolean) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }

    return data.user;
  },

  getRememberedEmail() {
    return localStorage.getItem('remembered_email');
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },


  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
      joinedAt: user.created_at,
    } as User;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name,
          avatar: session.user.user_metadata?.avatar_url,
          joinedAt: session.user.created_at,
        } as User);
      } else {
        callback(null);
      }
    });
  }
};

export const backend = authService; // Maintain compatibility with App.tsx for now
