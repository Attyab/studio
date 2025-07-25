'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// This is a singleton instance of the Supabase client.
let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  // If the client doesn't exist, create it.
  // The environment variables are checked here to ensure they are available.
  const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supUrl || !supKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client! Check your .env file.');
  }

  client = createBrowserClient(
    supUrl,
    supKey
  );

  return client;
}
