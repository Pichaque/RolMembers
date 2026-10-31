import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Raza definida por el narrador de una comunidad. */
export interface CommunityRace {
  id: string;
  serverId: string;
  name: string;
  traits: string[];
  createdBy: string;
  createdAt: string;
}

const AVISO_PERMISO_005 =
  'La tabla de razas existe, pero falta el permiso de la migración 005. Ejecuta supabase/migrations/005_permiso_razas.sql en el editor SQL.';

const AVISO_MIGRACION_004 =
  'Las razas personalizadas requieren la migración 004 en Supabase. Mientras tanto puedes usar rasgos de texto.';

/** CRUD de razas por comunidad. */
@Injectable({ providedIn: 'root' })
export class RaceService {
  private readonly supabase = inject(SupabaseService);

  /** @returns Lista de razas de la comunidad. */
  async list(serverId: string): Promise<CommunityRace[]> {
    const { races, notice } = await this.listOrEmpty(serverId);
    if (notice) {
      throw new Error(notice);
    }
    return races;
  }

  /**
   * Intenta listar. Si la tabla viva no tiene `created_by`, repite la consulta sin esa columna.
   * @returns Aviso solo si falta la tabla o el permiso de PostgREST.
   */
  async listOrEmpty(serverId: string): Promise<{ races: CommunityRace[]; notice: string }> {
    const first = await this.queryConAutor(serverId);
    if (!first.error) {
      return { races: mapRows(first.data ?? []), notice: '' };
    }
    if (faltaColumnaCreatedBy(first.error)) {
      const second = await this.querySinAutor(serverId);
      if (!second.error) {
        return { races: mapRows(second.data ?? []), notice: '' };
      }
      const notice = avisoDesdeError(second.error);
      if (notice) {
        return { races: [], notice };
      }
      throw new Error(second.error.message);
    }
    const notice = avisoDesdeError(first.error);
    if (notice) {
      return { races: [], notice };
    }
    throw new Error(first.error.message);
  }

  /**
   * Crea una raza. Si PostgREST no conoce `created_by`, reintenta sin esa columna.
   * @param userId Autor. Se omite cuando la tabla viva no tiene la columna.
   */
  async create(serverId: string, userId: string, name: string, traits: string[]): Promise<void> {
    const payload = {
      server_id: serverId,
      name: name.trim(),
      traits: traits.filter(Boolean),
      created_by: userId,
    };
    const { error } = await this.supabase.client.from('community_races').insert(payload);
    if (!error) {
      return;
    }
    if (!faltaColumnaCreatedBy(error)) {
      throw new Error(error.message);
    }
    const { created_by: _autor, ...sinAutor } = payload;
    const retry = await this.supabase.client.from('community_races').insert(sinAutor);
    if (retry.error) {
      throw new Error(retry.error.message);
    }
  }

  private queryConAutor(serverId: string) {
    return this.supabase.client
      .from('community_races')
      .select('id, server_id, name, traits, created_by, created_at')
      .eq('server_id', serverId)
      .order('name');
  }

  private querySinAutor(serverId: string) {
    return this.supabase.client
      .from('community_races')
      .select('id, server_id, name, traits, created_at')
      .eq('server_id', serverId)
      .order('name');
  }

  async update(id: string, name: string, traits: string[]): Promise<void> {
    const { error } = await this.supabase.client
      .from('community_races')
      .update({ name: name.trim(), traits: traits.filter(Boolean) })
      .eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('community_races').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }
}

/** Aviso de migración; null si el error debe mostrarse tal cual al usuario. */
export function avisoDesdeError(error: { message: string; code?: string | null }): string | null {
  const code = error.code ?? '';
  const message = error.message.toLowerCase();
  if (code === '42501' || message.includes('permission denied')) {
    return AVISO_PERMISO_005;
  }
  if (code === 'PGRST205' || (message.includes('does not exist') && !message.includes('permission denied'))) {
    return AVISO_MIGRACION_004;
  }
  if (message.includes('schema cache') && message.includes('community_races') && !message.includes('created_by')) {
    return AVISO_MIGRACION_004;
  }
  return null;
}

/** La tabla del proyecto se creó sin `created_by`; PostgREST responde PGRST204. */
export function faltaColumnaCreatedBy(error: { message: string; code?: string | null }): boolean {
  const message = error.message.toLowerCase();
  return message.includes('created_by') && (error.code === 'PGRST204' || message.includes('schema cache'));
}

function mapRows(rows: Array<{
  id: string;
  server_id: string;
  name: string;
  traits: unknown;
  created_at: string;
  created_by?: string | null;
}>): CommunityRace[] {
  return rows.map((row) => ({
    id: row.id,
    serverId: row.server_id,
    name: row.name,
    traits: parseTraits(row.traits),
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
  }));
}

function parseTraits(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
