import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from '../models/database.types';

@Injectable({ providedIn: 'root' })
/** Cliente supabase-js con la clave anónima. */
export class SupabaseService {
  readonly client = createClient<Database>(environment.supabaseUrl, environment.supabaseKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}
