import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Bu bilgiler "publishable/anon key" olduğu için mobil uygulama
// içinde bulunması güvenlidir (gizli anahtar değildir).
const supabaseUrl = 'https://mviagfelozflanfxtlcl.supabase.co';
const supabaseAnonKey = 'sb_publishable_jeCeh-8gDUWX0zjwzNRyAQ_p5PWPt4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
