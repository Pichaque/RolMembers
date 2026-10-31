import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserRole } from '../models/database.types';

export interface UserProfile {
  id: string;
  global_role: UserRole;
  display_name: string | null;
}

@Injectable({ providedIn: 'root' })
/** Perfil y rol global. */
export class ProfileService {
  private readonly supabase = inject(SupabaseService);

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, global_role, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async listProfiles(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, global_role, display_name')
      .order('display_name');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async setGlobalRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.supabase.client.rpc('admin_set_global_role', {
      p_user: userId,
      p_role: role,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('prohibido')) {
        throw new Error('Solo un administrador puede cambiar roles globales.');
      }
      if (message.includes('no valido') || message.includes('no válido')) {
        throw new Error('Ese rol global no es válido.');
      }
      if (message.includes('no encontrado')) {
        throw new Error('No se encontró el perfil.');
      }
      throw new Error(error.message || 'No se pudo cambiar el rol global.');
    }
  }
}
