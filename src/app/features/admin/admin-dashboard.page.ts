import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { firstValueFrom, forkJoin, from } from 'rxjs';
import { resumirInforme } from '../../core/utils/informes';
import { DocumentStoreService } from '../../core/services/document-store.service';
import { SqlApiService } from '../../core/services/sql-api.service';
import { ExportarInformeComponent } from '../../shared/components/exportar-informe.component';
import { GraficoComponent } from '../../shared/components/grafico.component';
import { WidgetEstadisticaComponent } from '../../shared/components/widget-estadistica.component';

interface FilaServidor { id: string; name: string }
interface FilaPersonaje { server_id: string; status: string; created_at: string }
interface FilaEvento { id: string; server_id: string; starts_at: string; title: string }
interface FilaMiembro { server_id: string; role: string }
interface FilaAsistencia { event_id: string; server_id: string; status: string }
interface FilaPerfil { global_role: string }

/** Panel de administración: indicadores, gráficos e informe. */
@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExportarInformeComponent, FormsModule, GraficoComponent, IonButton, IonContent, IonSpinner, RouterLink, WidgetEstadisticaComponent],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
/** Pieza de la aplicacion. */
export class AdminDashboardPage implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly exportado = signal('');
  readonly comunidad = signal('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly feedTotal = signal(0);
  readonly diceTotal = signal(0);

  readonly servidores = signal<FilaServidor[]>([]);
  private readonly characters = signal<FilaPersonaje[]>([]);
  private readonly events = signal<FilaEvento[]>([]);
  private readonly members = signal<FilaMiembro[]>([]);
  private readonly attendance = signal<FilaAsistencia[]>([]);
  private readonly profiles = signal<FilaPerfil[]>([]);

  private readonly sql = inject(SqlApiService);
  private readonly documents = inject(DocumentStoreService);

  readonly vista = computed(() => resumirInforme({
    servidores: this.servidores(),
    personajes: this.characters(),
    eventos: this.events(),
    miembros: this.members(),
    asistencia: this.attendance(),
    administradores: this.profiles().filter((row) => row.global_role === 'admin').length,
    comunidad: this.comunidad(),
    desde: this.desde(),
    hasta: this.hasta(),
  }));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await firstValueFrom(forkJoin({
        servers: this.sql.get<FilaServidor[]>('servers?select=id,name&order=name.asc'),
        characters: this.sql.get<FilaPersonaje[]>('characters?select=server_id,status,created_at'),
        events: this.sql.get<FilaEvento[]>('events?select=id,server_id,starts_at,title'),
        members: this.sql.get<FilaMiembro[]>('server_members?select=server_id,role'),
        attendance: this.sql.get<FilaAsistencia[]>('event_attendance?select=event_id,server_id,status'),
        profiles: this.sql.get<FilaPerfil[]>('profiles?select=global_role'),
        feed: from(this.documents.count('doc_feed')),
        dice: from(this.documents.count('doc_dice')),
      }));
      this.servidores.set(data.servers);
      this.characters.set(data.characters);
      this.events.set(data.events);
      this.members.set(data.members);
      this.attendance.set(data.attendance);
      this.profiles.set(data.profiles);
      this.feedTotal.set(data.feed);
      this.diceTotal.set(data.dice);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el panel.');
    } finally {
      this.loading.set(false);
    }
  }
}

