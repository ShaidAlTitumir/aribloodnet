import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (url: string | undefined, key: string | undefined) => {
  if (!url || !key) return true;
  return url.includes('your-project-id') || 
         url.includes('placeholder.supabase.co') ||
         key === 'your-anon-key' || 
         key === 'placeholder';
};

if (isPlaceholder(supabaseUrl, supabaseAnonKey)) {
  console.warn('Supabase credentials missing or using placeholders. Please check your .env file or AI Studio Secrets.');
}

export const isSupabaseConfigured = () => {
  return !isPlaceholder(supabaseUrl, supabaseAnonKey);
};

export const supabase = createClient(
  supabaseUrl && !isPlaceholder(supabaseUrl, supabaseAnonKey) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey && !isPlaceholder(supabaseUrl, supabaseAnonKey) ? supabaseAnonKey : 'placeholder'
);
