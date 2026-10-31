import { inject, Injectable } from '@angular/core';
import { DocumentStoreService } from './document-store.service';
import { SupabaseService } from './supabase.service';

/** Anuncio publicado en `doc_feed` con `kind = announcement`. */
export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

/**
 * Anuncios de una comunidad. Viven en `doc_feed`, no en una tabla propia.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly supabase = inject(SupabaseService);
  private readonly documents = inject(DocumentStoreService);

  /**
   * @param serverId Comunidad.
   * @returns Anuncios más recientes primero.
   */
  async list(serverId: string): Promise<AnnouncementItem[]> {
    const { data, error } = await this.supabase.client
      .from('doc_feed')
      .select('id, payload, created_at')
      .eq('server_id', serverId)
      .eq('kind', 'announcement')
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error('No se pudieron cargar los anuncios. Si la migración no está aplicada, esta consulta fallará.');
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      title: textField(row.payload, 'title'),
      content: textField(row.payload, 'content'),
      createdAt: row.created_at,
    }));
  }

  /**
   * Publica un anuncio. RLS limita la escritura al narrador o al administrador.
   * @returns Identificador de la entrada.
   */
  async publish(serverId: string, authorId: string, title: string, content: string): Promise<void> {
    await this.documents.addFeed(serverId, authorId, 'announcement', {
      title: title.trim(),
      content: content.trim(),
    });
  }

  /** Borra un anuncio de la comunidad. */
  async remove(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('doc_feed')
      .delete()
      .eq('id', id)
      .eq('kind', 'announcement')
      .select('id')
      .maybeSingle();
    if (error || !data) {
      throw new Error(error?.message || 'No se pudo borrar el anuncio.');
    }
  }
}

function textField(payload: unknown, key: string): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return '';
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}
