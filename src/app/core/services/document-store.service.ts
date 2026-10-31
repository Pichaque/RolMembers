import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/** Entrada del tablón. El jsonb se normaliza a título y detalle. */
export interface FeedDoc {
  id: string;
  serverId: string;
  authorId: string;
  kind: string;
  title: string;
  detail: string;
  createdAt: string;
}

/** Tirada guardada en `doc_dice`. */
export interface DiceDoc {
  id: string;
  serverId: string;
  userId: string;
  sides: number;
  result: number;
  label: string;
  createdAt: string;
}

/**
 * Almacén de documentos simulado sobre `doc_feed` y `doc_dice`.
 * PostgreSQL guarda jsonb y Realtime avisa de los INSERT.
 */
@Injectable({ providedIn: 'root' })
export class DocumentStoreService {
  private readonly supabase = inject(SupabaseService);

  /**
   * @param serverId Comunidad.
   * @param limit Máximo de filas. Por defecto 50.
   */
  async listFeed(serverId: string, limit = 50): Promise<FeedDoc[]> {
    const { data, error } = await this.supabase.client
      .from('doc_feed')
      .select('id, server_id, author_id, kind, payload, created_at')
      .eq('server_id', serverId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      throw new Error('No se pudo leer el tablón. Si la migración no está aplicada, `doc_feed` no existe.');
    }
    return (data ?? []).flatMap((row) => {
      const doc = toFeed(row);
      return doc ? [doc] : [];
    });
  }

  /** Historial reciente de dados de la comunidad. */
  async listDice(serverId: string, limit = 20): Promise<DiceDoc[]> {
    const { data, error } = await this.supabase.client
      .from('doc_dice')
      .select('id, server_id, user_id, payload, created_at')
      .eq('server_id', serverId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      throw new Error('No se pudieron leer las tiradas. Si la migración no está aplicada, `doc_dice` no existe.');
    }
    return (data ?? []).flatMap((row) => {
      const doc = toDice(row);
      return doc ? [doc] : [];
    });
  }

  /**
   * Inserta una noticia o un anuncio.
   * @param payload Campos de texto del documento.
   */
  async addFeed(serverId: string, authorId: string, kind: string, payload: Record<string, string>): Promise<void> {
    const { error } = await this.supabase.client.from('doc_feed').insert({
      server_id: serverId,
      author_id: authorId,
      kind,
      payload,
    });
    if (error) {
      throw new Error(error.message || 'No se pudo publicar en el tablón.');
    }
  }

  /** Guarda una tirada ya calculada en el cliente. */
  async addDice(serverId: string, userId: string, payload: { sides: number; result: number; label: string }): Promise<void> {
    const { error } = await this.supabase.client.from('doc_dice').insert({
      server_id: serverId,
      user_id: userId,
      payload,
    });
    if (error) {
      throw new Error(error.message || 'No se pudo guardar la tirada.');
    }
  }

  /**
   * Cuenta filas visibles. El panel de administración lo usa junto al SQL REST.
   * @param table `doc_feed` o `doc_dice`.
   */
  async count(table: 'doc_feed' | 'doc_dice', serverId?: string): Promise<number> {
    let query = this.supabase.client.from(table).select('id', { count: 'exact', head: true });
    if (serverId) {
      query = query.eq('server_id', serverId);
    }
    const { count, error } = await query;
    if (error) {
      throw new Error(error.message || 'No se pudo contar los documentos.');
    }
    return count ?? 0;
  }

  /**
   * Escucha INSERT de `doc_feed` de una comunidad.
   * @returns Función que cierra el canal con `removeChannel`.
   */
  watchFeed(serverId: string, onInsert: (doc: FeedDoc) => void): () => void {
    const channel = this.supabase.client
      .channel(`doc-feed-${serverId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doc_feed', filter: `server_id=eq.${serverId}` }, (payload) => {
        const doc = toFeed(payload.new);
        if (doc) {
          onInsert(doc);
        }
      })
      .subscribe();
    return () => this.close(channel);
  }

  /**
   * Escucha INSERT de `doc_dice` de una comunidad.
   * @returns Función que cierra el canal.
   */
  watchDice(serverId: string, onInsert: (doc: DiceDoc) => void): () => void {
    const channel = this.supabase.client
      .channel(`doc-dice-${serverId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doc_dice', filter: `server_id=eq.${serverId}` }, (payload) => {
        const doc = toDice(payload.new);
        if (doc) {
          onInsert(doc);
        }
      })
      .subscribe();
    return () => this.close(channel);
  }

  private close(channel: RealtimeChannel): void {
    void this.supabase.client.removeChannel(channel);
  }
}

function toFeed(row: unknown): FeedDoc | null {
  const record = recordOf(row);
  if (!record || typeof record['id'] !== 'string') {
    return null;
  }
  const payload = recordOf(record['payload']) ?? {};
  const kind = typeof record['kind'] === 'string' ? record['kind'] : '';
  return {
    id: record['id'],
    serverId: typeof record['server_id'] === 'string' ? record['server_id'] : '',
    authorId: typeof record['author_id'] === 'string' ? record['author_id'] : '',
    kind,
    title: feedTitle(kind, payload),
    detail: feedDetail(kind, payload),
    createdAt: typeof record['created_at'] === 'string' ? record['created_at'] : new Date().toISOString(),
  };
}

function toDice(row: unknown): DiceDoc | null {
  const record = recordOf(row);
  if (!record || typeof record['id'] !== 'string') {
    return null;
  }
  const payload = recordOf(record['payload']) ?? {};
  const sides = numberOf(payload['sides']);
  const result = numberOf(payload['result']);
  return {
    id: record['id'],
    serverId: typeof record['server_id'] === 'string' ? record['server_id'] : '',
    userId: typeof record['user_id'] === 'string' ? record['user_id'] : '',
    sides: sides ?? 0,
    result: result ?? 0,
    label: typeof payload['label'] === 'string' ? payload['label'] : '',
    createdAt: typeof record['created_at'] === 'string' ? record['created_at'] : new Date().toISOString(),
  };
}

function feedTitle(kind: string, payload: Record<string, unknown>): string {
  if (kind === 'announcement') {
    return text(payload['title']) || 'Anuncio';
  }
  if (kind === 'character_created') {
    return `Nuevo personaje: ${text(payload['name']) || 'sin nombre'}`;
  }
  if (kind === 'event_created') {
    return `Nueva sesión: ${text(payload['title']) || 'sin título'}`;
  }
  if (kind === 'attendance') {
    return `Asistencia: ${attendanceLabel(text(payload['status']))}`;
  }
  return kind || 'Noticia';
}

function feedDetail(kind: string, payload: Record<string, unknown>): string {
  if (kind === 'announcement') {
    return text(payload['content']);
  }
  if (kind === 'attendance') {
    return text(payload['eventTitle']);
  }
  return text(payload['place']);
}

function attendanceLabel(status: string): string {
  if (status === 'yes') {
    return 'Asisto';
  }
  if (status === 'maybe') {
    return 'Quizá';
  }
  if (status === 'no') {
    return 'No asisto';
  }
  return status;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberOf(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
