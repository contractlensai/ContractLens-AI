import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // For browser-side usage with an anon/publishable key keep sessions non-persistent
        // to avoid storing refresh tokens in the client.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
