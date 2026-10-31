import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { AttendanceStatus } from '../../core/models/database.types';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceCount, CalendarEventItem, CalendarService, SchedulableServer } from '../../core/services/calendar.service';
import { CommunityService } from '../../core/services/community.service';
import { downloadCsv } from '../../core/utils/csv';
import { SessionStore } from '../../core/stores/session.store';
import { eventNoConflict } from '../../shared/validators/async-validators';
import { CalendarioMesComponent, EventoCalendario } from '../../shared/components/calendario-mes.component';
import { ExportarInformeComponent } from '../../shared/components/exportar-informe.component';
import { TablonEventosComponent } from '../../shared/components/tablon-eventos.component';

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
  imports: [CalendarioMesComponent, ExportarInformeComponent, IonButton, IonContent, IonIcon, IonSpinner, ReactiveFormsModule, RouterLink, TablonEventosComponent],
})
/** Calendario global, tablón de sesiones y asistencia. */
export class CalendarPage implements OnInit {
  readonly events = signal<CalendarEventItem[]>([]);
  readonly attendance = signal<Map<string, AttendanceStatus>>(new Map());
  readonly memberServerIds = signal<Set<string>>(new Set());
  readonly manageableServerIds = signal<Set<string>>(new Set());
  readonly schedulableServers = signal<SchedulableServer[]>([]);
  readonly isAdmin = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly formError = signal('');
  readonly formSuccess = signal('');
  readonly view = signal<'month' | 'board'>('month');
  readonly monthCursor = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly comunidadFiltro = signal('');
  readonly diaActivo = signal<Date | null>(null);
  readonly counts = signal<Map<string, AttendanceCount>>(new Map());

  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  private readonly formBuilder = inject(FormBuilder);
  readonly eventForm = this.formBuilder.nonNullable.group({
    serverId: ['', Validators.required],
    title: ['', Validators.required],
    place: ['', Validators.required],
    description: [''],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
  }, { asyncValidators: [eventNoConflict(this.calendar, () => this.editingId() ?? undefined)] });
  private readonly communities = inject(CommunityService);
  private readonly session = inject(SessionStore);

  ngOnInit(): void {
    void this.load();
  }

  attendanceOf(eventId: string): AttendanceStatus | null {
    return this.attendance().get(eventId) ?? null;
  }

  canAnswer(event: CalendarEventItem): boolean {
    return this.memberServerIds().has(event.serverId);
  }

  canManage(event: CalendarEventItem): boolean {
    return this.isAdmin() || this.manageableServerIds().has(event.serverId);
  }

  monthLabel(): string {
    return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(this.monthCursor());
  }

  shiftMonth(delta: number): void {
    const current = this.monthCursor();
    this.monthCursor.set(new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  monthCells(): Array<{ date: Date | null; events: CalendarEventItem[] }> {
    const cursor = this.monthCursor();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: Array<{ date: Date | null; events: CalendarEventItem[] }> = [];
    for (let index = 0; index < pad; index += 1) {
      cells.push({ date: null, events: [] });
    }
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      cells.push({
        date,
        events: this.events().filter((event) => sameDay(new Date(event.startsAt), date)),
      });
    }
    return cells;
  }

  noteTilt(index: number): string {
    const tilts = [-2.5, 1.8, -1.2, 2.4, -0.6];
    return `${tilts[index % tilts.length]}deg`;
  }

  visibles(): CalendarEventItem[] {
    const filtro = this.comunidadFiltro();
    return this.events().filter((event) => !filtro || event.serverId === filtro);
  }

  comunidadesFiltro(): Array<{ id: string; name: string }> {
    const seen = new Map<string, string>();
    for (const event of this.events()) {
      seen.set(event.serverId, event.serverName);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }

  eventosDelDia(): CalendarEventItem[] {
    const dia = this.diaActivo();
    if (!dia) {
      return [];
    }
    return this.visibles().filter((event) => sameDay(new Date(event.startsAt), dia));
  }

  conteo(eventId: string): AttendanceCount {
    return this.counts().get(eventId) ?? { yes: 0, maybe: 0, no: 0 };
  }

  filtrarComunidad(event: Event): void {
    this.comunidadFiltro.set(event.target instanceof HTMLSelectElement ? event.target.value : '');
  }

  eventosMes(): EventoCalendario[] {
    const cursor = this.monthCursor();
    return this.visibles()
      .filter((event) => {
        const date = new Date(event.startsAt);
        return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
      })
      .map((event) => ({
        id: event.id,
        dia: new Date(event.startsAt).getDate(),
        titulo: event.title,
        comunidad: event.serverName,
        color: event.color,
      }));
  }

  notasTablon() {
    return this.visibles().map((event) => ({
      id: event.id,
      titulo: event.title,
      detalle: `${this.formatWhen(event.startsAt)} · ${event.place}`,
      comunidad: event.serverName,
      color: event.color,
    }));
  }

  filasInforme(): string[][] {
    return this.visibles().map((event) => {
      const count = this.conteo(event.id);
      return [
        event.serverName,
        event.title,
        event.place,
        this.formatWhen(event.startsAt),
        this.formatWhen(event.endsAt),
        String(count.yes),
        String(count.maybe),
        String(count.no),
      ];
    });
  }

  diaSeleccionado(fecha: Date): void {
    this.monthCursor.set(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    this.diaActivo.set(fecha);
  }

  eventoSeleccionado(id: string): void {
    const event = this.events().find((item) => item.id === id);
    if (!event) {
      return;
    }
    this.diaActivo.set(new Date(event.startsAt));
    this.formSuccess.set(`Sesión seleccionada: ${event.title}`);
  }

  etiquetaDia(): string {
    const dia = this.diaActivo();
    return dia ? new Intl.DateTimeFormat('es', { dateStyle: 'full' }).format(dia) : '';
  }

  avisoExportacion(nombre: string): void {
    this.formSuccess.set(`Informe descargado: ${nombre}`);
  }

  formatWhen(value: string): string {
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  editEvent(event: CalendarEventItem): void {
    this.editingId.set(event.id);
    this.eventForm.patchValue({
      serverId: event.serverId,
      title: event.title,
      place: event.place,
      description: event.description ?? '',
      startsAt: toLocalInput(event.startsAt),
      endsAt: toLocalInput(event.endsAt),
    });
  }

  async createEvent(): Promise<void> {
    const user = this.auth.user();
    if (!user || this.saving() || this.eventForm.pending) {
      return;
    }
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }
    const raw = this.eventForm.getRawValue();

    this.saving.set(true);
    this.formError.set('');
    this.formSuccess.set('');
    try {
      const payload = {
        title: raw.title,
        place: raw.place,
        description: raw.description.trim() || null,
        startsAt: toIso(raw.startsAt),
        endsAt: toIso(raw.endsAt),
      };
      const editingId = this.editingId();
      if (editingId) {
        await this.calendar.updateEvent(editingId, payload);
      } else {
        await this.calendar.createEvent({ ...payload, serverId: raw.serverId, createdBy: user.id });
      }
      this.editingId.set(null);
      this.eventForm.reset({ serverId: raw.serverId, title: '', place: '', description: '', startsAt: '', endsAt: '' });
      this.formSuccess.set('Evento publicado en el calendario global.');
      await this.load(false);
    } catch (error: unknown) {
      this.formError.set(error instanceof Error ? error.message : 'No se pudo crear el evento.');
    } finally {
      this.saving.set(false);
    }
  }

  async chooseAttendance(event: CalendarEventItem, status: AttendanceStatus): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    try {
      await this.calendar.setAttendance(event.id, event.serverId, user.id, status, event.title);
      this.attendance.update((current) => new Map(current).set(event.id, status));
      this.counts.set(await this.calendar.listAttendanceCounts(this.events().map((item) => item.id)));
      this.error.set('');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar la asistencia.');
    }
  }

  async removeEvent(event: CalendarEventItem): Promise<void> {
    try {
      await this.calendar.deleteEvent(event.id);
      await this.load(false);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo eliminar el evento.');
    }
  }

  exportCsv(): void {
    downloadCsv(
      'calendario.csv',
      ['Comunidad', 'Título', 'Lugar', 'Inicio', 'Fin', 'Descripción'],
      this.events().map((event) => [
        event.serverName,
        event.title,
        event.place,
        this.formatWhen(event.startsAt),
        this.formatWhen(event.endsAt),
        event.description ?? '',
      ]),
    );
  }

  printPdf(): void {
    globalThis.print();
  }

  private async load(showLoading = true): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set('');

    try {
      await this.session.ensure();
      const isAdmin = this.session.isAdmin();
      const [events, attendance, memberships, schedulable] = await Promise.all([
        this.calendar.listEvents(),
        this.calendar.listMyAttendance(user.id),
        this.communities.listForUser(user.id),
        this.calendar.listSchedulableServers(user.id, isAdmin),
      ]);
      this.events.set(events);
      this.counts.set(await this.calendar.listAttendanceCounts(events.map((event) => event.id)));
      this.attendance.set(attendance);
      this.memberServerIds.set(new Set(memberships.map((server) => server.id)));
      this.schedulableServers.set(schedulable);
      this.manageableServerIds.set(new Set(schedulable.map((server) => server.id)));
      this.isAdmin.set(isAdmin);
      if (!this.eventForm.controls.serverId.value && schedulable[0]) {
        this.eventForm.controls.serverId.setValue(schedulable[0].id);
      }
    } catch (error: unknown) {
      this.error.set(error instanceof Error
        ? `No se pudo cargar el calendario: ${error.message}`
        : 'No se pudo cargar el calendario.');
    } finally {
      this.loading.set(false);
    }
  }
}

function sameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Indica una fecha y hora válidas.');
  }
  return date.toISOString();
}
