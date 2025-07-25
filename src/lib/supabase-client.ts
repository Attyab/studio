'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supUrl || !supKey) {
    // This check will now correctly throw the error if the variables are missing.
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client! Check your .env file.');
  }

  client = createBrowserClient(
    supUrl,
    supKey
  );

  return client;
}
