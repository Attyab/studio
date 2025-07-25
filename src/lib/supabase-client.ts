
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const supUrl = 'https://pqdvdpjrtaehnwcwptwa.supabase.co';
  const supKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZHZkcGpydGFlaG53Y3dwdHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MDIzNDYsImV4cCI6MjA2ODk3ODM0Nn0.dEpI8Ai0LTXltEbchZFVRuE9Iq-JmEAKbmt8JV26M98';
  
  if (!supUrl || !supKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client! Check your .env file.');
  }

  client = createBrowserClient(
    supUrl,
    supKey
  );

  return client;
}
