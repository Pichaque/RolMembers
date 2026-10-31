import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET = 'retratos';

/** Sube retratos de personaje a Storage. Path: `{serverId}/{characterId}`. */
@Injectable({ providedIn: 'root' })
export class PortraitService {
  private readonly supabase = inject(SupabaseService);

  /** URL pública del retrato si existe. */
  resolvePublicUrl(path: string | null | undefined): string | null {
    if (!path?.trim()) {
      return null;
    }
    const { data } = this.supabase.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl || null;
  }

  /**
   * Sube la imagen y devuelve la ruta guardada en `characters.data.retrato`.
   * @throws Si falta el bucket (migración 004).
   */
  async upload(serverId: string, characterId: string, file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(extension) ? extension.replace('jpeg', 'jpg') : 'jpg';
    const path = `${serverId}/${characterId}.${safeExt}`;
    const { error } = await this.supabase.client.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('bucket') || lower.includes('not found')) {
        throw new Error('El bucket de retratos requiere la migración 004 en Supabase.');
      }
      throw new Error(error.message || 'No se pudo subir el retrato.');
    }
    return path;
  }
}
