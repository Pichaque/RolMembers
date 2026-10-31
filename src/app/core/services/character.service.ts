import { inject, Injectable } from '@angular/core';
import { CharacterStatus, Json } from '../models/database.types';
import { DocumentStoreService } from './document-store.service';
import { SupabaseService } from './supabase.service';

/** Ficha guardada en `characters.data`. */
export interface CharacterSheet {
  profesion: string;
  edad: number | null;
  aspecto: string;
  historia: string;
  rasgos: string[];
  raceId?: string | null;
  retrato?: string | null;
}

/** Personaje de una comunidad, con su ficha. */
export interface CharacterRecord {
  id: string;
  serverId: string;
  ownerId: string;
  name: string;
  status: CharacterStatus;
  sheet: CharacterSheet;
}

const EMPTY_SHEET: CharacterSheet = { profesion: '', edad: null, aspecto: '', historia: '', rasgos: [], raceId: null, retrato: null };

/** Personajes de una comunidad. */
@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly supabase = inject(SupabaseService);
  private readonly documents = inject(DocumentStoreService);

  /**
   * Comprueba el nombre con la RPC. `excludeId` exige la migración 003.
   * @returns `true` si el nombre se puede usar.
   */
  async nameAvailable(serverId: string, name: string, excludeId?: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('character_name_available', {
      p_server: serverId,
      p_name: name.trim(),
      ...(excludeId ? { p_exclude: excludeId } : {}),
    });
    if (error) {
      throw new Error(this.mapNameError(error.message));
    }
    return Boolean(data);
  }

  /** Lista los personajes de una comunidad. */
  async list(serverId: string): Promise<CharacterRecord[]> {
    const { data, error } = await this.supabase.client
      .from('characters')
      .select('id, server_id, owner_id, name, data, status')
      .eq('server_id', serverId)
      .order('name');
    if (error) {
      throw new Error(error.message || 'No se pudieron cargar los personajes.');
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      serverId: row.server_id,
      ownerId: row.owner_id,
      name: row.name,
      status: row.status,
      sheet: parseSheet(row.data),
    }));
  }

  /** Crea un personaje en estado `pending`. @returns Identificador del personaje creado. */
  async create(serverId: string, userId: string, name: string, data: Json = {}): Promise<string> {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new Error('El nombre del personaje debe tener entre 1 y 80 caracteres.');
    }
    const available = await this.nameAvailable(serverId, trimmed);
    if (!available) {
      throw new Error('Ese nombre ya existe en la comunidad o no puedes crear personajes aquí.');
    }
    const { data: row, error } = await this.supabase.client.from('characters').insert({
      server_id: serverId,
      owner_id: userId,
      name: trimmed,
      data,
      status: 'pending',
    }).select('id').single();
    if (error || !row) {
      throw new Error(error?.message || 'No se pudo crear el personaje.');
    }
    await this.documents.addFeed(serverId, userId, 'character_created', { name: trimmed }).catch(() => undefined);
    return row.id;
  }

  /**
   * Actualiza nombre y ficha. El dueño es quien puede hacerlo; RLS lo confirma.
   * @param excludeId Identificador que se excluye al comprobar el nombre.
   */
  async update(characterId: string, name: string, sheet: CharacterSheet, serverId: string): Promise<void> {
    const trimmed = name.trim();
    const available = await this.nameAvailable(serverId, trimmed, characterId);
    if (!available) {
      throw new Error('Ese nombre ya existe en la comunidad.');
    }
    const { data, error } = await this.supabase.client
      .from('characters')
      .update({ name: trimmed, data: sheetToJson(sheet) })
      .eq('id', characterId)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      throw new Error(error?.message || 'No se pudo guardar el personaje.');
    }
  }

  /** Borra un personaje propio. RLS impide borrar el de otro roleador. */
  async remove(characterId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('characters')
      .delete()
      .eq('id', characterId)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      throw new Error(error?.message || 'No se pudo eliminar el personaje.');
    }
  }

  /** Aprueba o rechaza. Solo narrador o administrador, según RLS. */
  async setStatus(characterId: string, status: 'approved' | 'rejected'): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('characters')
      .update({ status })
      .eq('id', characterId)
      .select('id')
      .maybeSingle();
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('solo el narrador') || message.includes('estado')) {
        throw new Error('Solo el narrador de la comunidad o un administrador pueden cambiar el estado.');
      }
      throw new Error(error.message || 'No se pudo cambiar el estado del personaje.');
    }
    if (!data) {
      throw new Error('No se pudo cambiar el estado del personaje.');
    }
  }

  private mapNameError(message: string): string {
    if (message.toLowerCase().includes('p_exclude') || message.toLowerCase().includes('schema cache')) {
      return 'La comprobación al editar necesita la migración 003 en Supabase.';
    }
    return 'No se pudo comprobar si el nombre del personaje está libre.';
  }
}

/** Convierte la ficha al jsonb que guarda la tabla. */
export function sheetToJson(sheet: CharacterSheet): Json {
  return {
    profesion: sheet.profesion,
    edad: sheet.edad,
    aspecto: sheet.aspecto,
    historia: sheet.historia,
    rasgos: sheet.rasgos,
    raceId: sheet.raceId ?? null,
    retrato: sheet.retrato ?? null,
  };
}

function parseSheet(data: Json): CharacterSheet {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ...EMPTY_SHEET };
  }
  const edad = data['edad'];
  const rasgos = data['rasgos'];
  return {
    profesion: typeof data['profesion'] === 'string' ? data['profesion'] : '',
    edad: typeof edad === 'number' ? edad : null,
    aspecto: typeof data['aspecto'] === 'string' ? data['aspecto'] : '',
    historia: typeof data['historia'] === 'string' ? data['historia'] : '',
    rasgos: Array.isArray(rasgos) ? rasgos.filter((item): item is string => typeof item === 'string') : [],
    raceId: typeof data['raceId'] === 'string' ? data['raceId'] : null,
    retrato: typeof data['retrato'] === 'string' ? data['retrato'] : null,
  };
}
