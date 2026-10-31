import { inject, Injectable } from '@angular/core';
import { mapCommunityRpc, mapJoinError } from './supabase-errors';
import { SupabaseService } from './supabase.service';

/** Códigos de invitación de una comunidad. */
@Injectable({ providedIn: 'root' })
export class InviteService {
  private readonly supabase = inject(SupabaseService);

  /** Código actual, o `null` si todavía no hay. */
  async getCode(serverId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('server_invites')
      .select('code')
      .eq('server_id', serverId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data?.code ?? null;
  }

  /** Sustituye el código con `regenerate_invite_code`. */
  async regenerate(serverId: string): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('regenerate_invite_code', { p_server: serverId });
    if (error) {
      throw new Error(mapCommunityRpc(error.message));
    }
    if (!data) {
      throw new Error('No se pudo generar el código de invitación.');
    }
    return data;
  }

  /** @returns `true` cuando `invite_code_valid` acepta el código. */
  async isValid(code: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('invite_code_valid', { p_code: code.trim() });
    if (error) {
      throw new Error('No se pudo comprobar el código de invitación.');
    }
    return Boolean(data);
  }

  /**
   * Entra como roleador.
   * @returns Identificador de la comunidad.
   */
  async join(code: string): Promise<string> {
    const normalized = code.trim();
    if (!normalized) {
      throw new Error('Introduce un código de invitación para continuar.');
    }
    if (!(await this.isValid(normalized))) {
      throw new Error('El código de invitación no es válido.');
    }
    const { data, error } = await this.supabase.client.rpc('join_server', { p_code: normalized });
    if (error) {
      throw new Error(mapJoinError(error.message));
    }
    if (!data) {
      throw new Error('La invitación no devolvió una comunidad.');
    }
    return data;
  }
}
