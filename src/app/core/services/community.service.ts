import { inject, Injectable } from '@angular/core';
import { CommunityRole, ThemePalette } from '../models/database.types';
import { CommunityServer, MembershipRef } from '../models/community.models';
import { normalizeTheme, themeToJson } from '../models/theme-presets';
import { mapCommunityRpc, toCommunitySlug } from './supabase-errors';
import { SupabaseService } from './supabase.service';

const DEFAULT_THEME: ThemePalette = { primary: '#b97650', secondary: '#d19367' };

/**
 * Lectura y escritura de comunidades (`servers`).
 */
@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Comunidades en las que participa el usuario.
   * @param userId Identificador de `auth.users`.
   */
  async listForUser(userId: string): Promise<CommunityServer[]> {
    const memberships = await this.listMemberships(userId);
    if (memberships.length === 0) {
      return [];
    }
    const ids = [...new Set(memberships.map((member) => member.serverId))];
    const { data, error } = await this.supabase.client
      .from('servers')
      .select('id, name, slug, description, theme, created_by')
      .in('id', ids)
      .order('name');
    if (error) {
      throw error;
    }
    const byId = new Map((data ?? []).map((server) => [server.id, server]));
    return memberships.flatMap((membership) => {
      const server = byId.get(membership.serverId);
      return server ? [this.toCommunity(server, membership.role)] : [];
    });
  }

  /** Membresías del usuario, sin fichas de personaje. */
  async listMemberships(userId: string): Promise<MembershipRef[]> {
    const { data, error } = await this.supabase.client
      .from('server_members')
      .select('server_id, role')
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
    const unique = [...new Map((data ?? []).map((row) => [row.server_id, row])).values()];
    return unique.map((row) => ({ serverId: row.server_id, role: row.role }));
  }

  /**
   * Detalle de una comunidad y el rol del usuario, si es miembro.
   * @returns `null` cuando la fila no existe.
   */
  async getDetails(serverId: string, userId: string): Promise<CommunityServer | null> {
    const { data, error } = await this.supabase.client
      .from('servers')
      .select('id, name, slug, description, theme, created_by')
      .eq('id', serverId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    const { data: membership, error: membershipError } = await this.supabase.client
      .from('server_members')
      .select('role')
      .eq('server_id', serverId)
      .eq('user_id', userId)
      .maybeSingle();
    if (membershipError) {
      throw membershipError;
    }
    return this.toCommunity(data, membership?.role ?? null);
  }

  /** Cuenta comunidades creadas por el usuario. El límite de 3 lo aplica la RPC. */
  async countCreated(userId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('servers')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId);
    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  /** Comprueba si otro registro ya usa el slug. `excludeId` sirve al editar. */
  async slugTaken(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase.client.from('servers').select('id').eq('slug', slug);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      throw error;
    }
    return Boolean(data);
  }

  /**
   * Crea la comunidad con `create_community`. El creador queda como narrador.
   * @returns Identificador nuevo.
   */
  async create(input: { name: string; description?: string | null; theme?: ThemePalette | null }): Promise<{ id: string }> {
    const name = input.name.trim();
    if (name.length < 3 || name.length > 50) {
      throw new Error('El nombre debe tener entre 3 y 50 caracteres.');
    }
    const description = input.description?.trim() || null;
    if (description && description.length > 500) {
      throw new Error('La descripción no puede superar los 500 caracteres.');
    }
    const slug = toCommunitySlug(name);
    if (!slug) {
      throw new Error('El nombre debe incluir al menos una letra o un número.');
    }
    const { data, error } = await this.supabase.client.rpc('create_community', {
      p_name: name,
      p_slug: slug,
      p_description: description,
      p_theme: themeToJson(input.theme ?? DEFAULT_THEME),
    });
    if (error) {
      throw new Error(mapCommunityRpc(error.message));
    }
    if (!data) {
      throw new Error('Supabase no devolvió la comunidad creada.');
    }
    return { id: data };
  }

  /** Actualiza nombre, descripción y tema. RLS limita esto al narrador o al administrador. */
  async update(serverId: string, input: { name: string; description?: string | null; theme: ThemePalette }): Promise<void> {
    const name = input.name.trim();
    if (name.length < 3 || name.length > 50) {
      throw new Error('El nombre debe tener entre 3 y 50 caracteres.');
    }
    const description = input.description?.trim() || null;
    if (description && description.length > 500) {
      throw new Error('La descripción no puede superar los 500 caracteres.');
    }
    const { data, error } = await this.supabase.client
      .from('servers')
      .update({ name, description, theme: normalizeTheme(input.theme) })
      .eq('id', serverId)
      .select('id')
      .maybeSingle();
    if (error) {
      throw new Error(error.message || 'No se pudo guardar la comunidad.');
    }
    if (!data) {
      throw new Error('No se pudo guardar la comunidad. Solo su narrador o un administrador pueden editarla.');
    }
  }

  /** Borra la comunidad con `delete_community`. */
  async remove(serverId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('delete_community', { p_server: serverId });
    if (error) {
      throw new Error(mapCommunityRpc(error.message));
    }
  }

  private toCommunity(
    server: { id: string; name: string; slug: string; description: string | null; theme: ThemePalette; created_by: string | null },
    role: CommunityRole | null,
  ): CommunityServer {
    return {
      id: server.id,
      name: server.name,
      slug: server.slug,
      description: server.description,
      theme: server.theme ?? DEFAULT_THEME,
      userRole: role,
      createdBy: server.created_by,
    };
  }
}
