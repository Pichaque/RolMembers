import { inject, Injectable } from '@angular/core';
import { AttendanceStatus, ThemePalette } from '../models/database.types';
import { DocumentStoreService } from './document-store.service';
import { SupabaseService } from './supabase.service';

export interface CalendarEventItem {
  id: string;
  serverId: string;
  serverName: string;
  color: string;
  title: string;
  place: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  createdBy: string;
}

export interface SchedulableServer {
  id: string;
  name: string;
}

/** Recuento de asistencia de un evento. */
export interface AttendanceCount {
  yes: number;
  maybe: number;
  no: number;
}

const DEFAULT_COLOR = '#b97650';

@Injectable({ providedIn: 'root' })
/** Lectura y escritura de eventos y asistencia. */
export class CalendarService {
  private readonly supabase = inject(SupabaseService);
  private readonly documents = inject(DocumentStoreService);

  async listEvents(): Promise<CalendarEventItem[]> {
    const { data: events, error } = await this.supabase.client
      .from('events')
      .select('id, server_id, title, place, description, starts_at, ends_at, created_by')
      .order('starts_at');

    if (error) {
      throw error;
    }

    const serverIds = [...new Set((events ?? []).map((event) => event.server_id))];
    const serverMap = await this.loadServerNames(serverIds);

    return (events ?? []).map((event) => {
      const server = serverMap.get(event.server_id);
      return {
        id: event.id,
        serverId: event.server_id,
        serverName: server?.name ?? 'Comunidad',
        color: server?.color ?? DEFAULT_COLOR,
        title: event.title,
        place: event.place,
        description: event.description,
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        createdBy: event.created_by,
      };
    });
  }

  /**
   * Cuenta las respuestas visibles para el usuario. RLS decide qué filas llegan.
   * @param eventIds Eventos del calendario cargado.
   */
  async listAttendanceCounts(eventIds: string[]): Promise<Map<string, AttendanceCount>> {
    const counts = new Map<string, AttendanceCount>();
    if (eventIds.length === 0) {
      return counts;
    }
    const { data, error } = await this.supabase.client
      .from('event_attendance')
      .select('event_id, status')
      .in('event_id', eventIds);
    if (error) {
      throw new Error(error.message || 'No se pudo cargar el recuento de asistencia.');
    }
    for (const row of data ?? []) {
      const current = counts.get(row.event_id) ?? { yes: 0, maybe: 0, no: 0 };
      current[row.status] += 1;
      counts.set(row.event_id, current);
    }
    return counts;
  }

  async listMyAttendance(userId: string): Promise<Map<string, AttendanceStatus>> {
    const { data, error } = await this.supabase.client
      .from('event_attendance')
      .select('event_id, status')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return new Map((data ?? []).map((row) => [row.event_id, row.status]));
  }

  async listSchedulableServers(userId: string, isAdmin: boolean): Promise<SchedulableServer[]> {
    if (isAdmin) {
      const { data, error } = await this.supabase.client
        .from('servers')
        .select('id, name')
        .order('name');
      if (error) {
        throw error;
      }
      return data ?? [];
    }

    const { data: memberships, error: membershipError } = await this.supabase.client
      .from('server_members')
      .select('server_id')
      .eq('user_id', userId)
      .eq('role', 'narrator');

    if (membershipError) {
      throw membershipError;
    }

    const ids = [...new Set((memberships ?? []).map((member) => member.server_id))];
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('servers')
      .select('id, name')
      .in('id', ids)
      .order('name');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async createEvent(input: {
    serverId: string;
    title: string;
    place: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    createdBy: string;
  }): Promise<void> {
    const title = input.title.trim();
    const place = input.place.trim();
    if (!title || !place) {
      throw new Error('El título y el lugar son obligatorios.');
    }
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new Error('La hora de fin tiene que ser posterior a la de inicio.');
    }

    if (await this.hasConflict(place, input.startsAt, input.endsAt)) {
      throw new Error('Ese lugar ya tiene otro evento en ese horario.');
    }

    const { error } = await this.supabase.client.from('events').insert({
      server_id: input.serverId,
      title,
      place,
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      created_by: input.createdBy,
    });

    if (error) {
      throw new Error(error.message || 'No se pudo crear el evento. Solo un narrador de esa comunidad o un administrador pueden hacerlo.');
    }
    await this.documents.addFeed(input.serverId, input.createdBy, 'event_created', {
      title,
      place,
    }).catch(() => undefined);
  }

  /**
   * @param excludeId Evento que se está editando. Requiere la migración 003.
   * @returns `true` si el lugar ya está ocupado en ese intervalo.
   */
  async hasConflict(place: string, startsAt: string, endsAt: string, excludeId?: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('event_conflict', {
      p_place: place,
      p_start: startsAt,
      p_end: endsAt,
      ...(excludeId ? { p_exclude: excludeId } : {}),
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('p_exclude') || message.includes('schema cache')) {
        throw new Error('La comprobación al editar necesita la migración 003 en Supabase.');
      }
      throw new Error('No se pudo comprobar si el lugar está libre.');
    }
    return Boolean(data);
  }

  /** Actualiza un evento y excluye su propio horario del conflicto. */
  async updateEvent(eventId: string, input: {
    title: string;
    place: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
  }): Promise<void> {
    if (await this.hasConflict(input.place, input.startsAt, input.endsAt, eventId)) {
      throw new Error('Ese lugar ya tiene otro evento en ese horario.');
    }
    const { error } = await this.supabase.client.from('events').update({
      title: input.title.trim(),
      place: input.place.trim(),
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    }).eq('id', eventId);
    if (error) {
      throw new Error(error.message || 'No se pudo actualizar el evento.');
    }
  }

  async setAttendance(eventId: string, serverId: string, userId: string, status: AttendanceStatus, eventTitle = ''): Promise<void> {
    const { error } = await this.supabase.client.from('event_attendance').upsert(
      {
        event_id: eventId,
        server_id: serverId,
        user_id: userId,
        status,
      },
      { onConflict: 'event_id,user_id' },
    );

    if (error) {
      throw new Error(error.message || 'No se pudo guardar tu asistencia. Tienes que ser miembro de esa comunidad.');
    }
    await this.documents.addFeed(serverId, userId, 'attendance', {
      status,
      eventId,
      eventTitle,
    }).catch(() => undefined);
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('events')
      .delete()
      .eq('id', eventId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'No se pudo eliminar el evento.');
    }
    if (!data) {
      throw new Error('No se pudo eliminar el evento. Solo el narrador de esa comunidad o un administrador pueden hacerlo.');
    }
  }

  private async loadServerNames(ids: string[]): Promise<Map<string, { name: string; color: string }>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.client
      .from('servers')
      .select('id, name, theme')
      .in('id', ids);

    if (error) {
      throw error;
    }

    return new Map((data ?? []).map((server) => [server.id, { name: server.name, color: colorFromTheme(server.theme) }]));
  }
}

function colorFromTheme(theme: ThemePalette | null): string {
  const primary = theme?.primary;
  return typeof primary === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(primary) ? primary : DEFAULT_COLOR;
}
