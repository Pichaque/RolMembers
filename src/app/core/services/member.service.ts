import { inject, Injectable } from '@angular/core';
import { CommunityRole } from '../models/database.types';
import { CommunityMember, MemberCharacter } from '../models/community.models';
import { mapCommunityRpc } from './supabase-errors';
import { SupabaseService } from './supabase.service';

/** Miembros de una comunidad y sus personajes resumidos. */
@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly supabase = inject(SupabaseService);

  /** @param serverId Comunidad. */
  async list(serverId: string): Promise<CommunityMember[]> {
    const { data, error } = await this.supabase.client
      .from('server_members')
      .select('user_id, role')
      .eq('server_id', serverId);
    if (error) {
      throw error;
    }
    const rows = [...new Map((data ?? []).map((row) => [row.user_id, row])).values()];
    if (rows.length === 0) {
      return [];
    }
    const userIds = rows.map((row) => row.user_id);
    const { data: profiles, error: profilesError } = await this.supabase.client
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    if (profilesError) {
      throw profilesError;
    }
    const { data: characters, error: charactersError } = await this.supabase.client
      .from('characters')
      .select('id, owner_id, name, status, data')
      .eq('server_id', serverId);
    if (charactersError) {
      throw charactersError;
    }
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const byOwner = new Map<string, MemberCharacter[]>();
    for (const character of characters ?? []) {
      const current = byOwner.get(character.owner_id) ?? [];
      current.push(parseMemberCharacter(character));
      byOwner.set(character.owner_id, current);
    }
    return rows.map((row) => ({
      userId: row.user_id,
      role: row.role,
      displayName: names.get(row.user_id)?.trim() || 'Miembro',
      characters: byOwner.get(row.user_id) ?? [],
    }));
  }

  /**
   * Cambia el rol. La base impide degradar al creador.
   * @param role `narrator` o `player`.
   */
  async updateRole(serverId: string, memberId: string, role: CommunityRole): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('server_members')
      .update({ role })
      .eq('server_id', serverId)
      .eq('user_id', memberId)
      .select('id')
      .maybeSingle();
    if (error) {
      throw new Error(mapCommunityRpc(error.message));
    }
    if (!data) {
      throw new Error('No se pudo cambiar el rol. El creador no se puede degradar.');
    }
  }

  /** Expulsa a un miembro que no sea el creador. */
  async remove(serverId: string, memberId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('server_members')
      .delete()
      .eq('server_id', serverId)
      .eq('user_id', memberId)
      .select('id')
      .maybeSingle();
    if (error) {
      throw new Error(mapCommunityRpc(error.message));
    }
    if (!data) {
      throw new Error('No se pudo expulsar al miembro. El creador de la comunidad no se puede quitar.');
    }
  }
}

function parseMemberCharacter(row: { id: string; name: string; status: MemberCharacter['status']; data: unknown }): MemberCharacter {
  const data = row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {};
  const rasgos = data['rasgos'];
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    profesion: typeof data['profesion'] === 'string' ? data['profesion'] : '',
    rasgos: Array.isArray(rasgos) ? rasgos.filter((item): item is string => typeof item === 'string') : [],
  };
}
