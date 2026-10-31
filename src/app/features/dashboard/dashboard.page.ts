import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { UserProfile } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { communityRoleLabel, CommunityRole, ThemePalette } from '../../core/models/database.types';
import { CommunityServer } from '../../core/models/community.models';
import { InviteService } from '../../core/services/invite.service';
import { SqlApiService } from '../../core/services/sql-api.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { inviteCodeValid } from '../../shared/validators/async-validators';
import { WidgetEstadisticaComponent } from '../../shared/components/widget-estadistica.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonSpinner, ReactiveFormsModule, RouterLink, WidgetEstadisticaComponent],
})
/** Espacio del usuario con comunidades, sesiones y código de invitación. */
export class DashboardPage implements OnInit {
  readonly profile = signal<UserProfile | null>(null);
  readonly profileLoading = signal(true);
  readonly profileError = signal('');

  readonly communities = signal<CommunityServer[]>([]);
  readonly communitiesLoading = signal(true);
  readonly communitiesError = signal('');
  readonly upcoming = signal<Array<{ id: string; title: string; when: string; serverName: string }>>([]);
  readonly upcomingError = signal('');
  readonly pendingCharacters = signal(0);
  readonly agendaLoading = signal(true);
  private readonly formBuilder = inject(FormBuilder);
  readonly invite = this.formBuilder.nonNullable.control('', { asyncValidators: [inviteCodeValid(inject(InviteService))] });
  readonly inviteStatus = signal('');
  readonly inviteIsError = signal(false);
  readonly inviteLoading = signal(false);
  readonly roleLabel = communityRoleLabel;

  readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly community = inject(CommunityStore);
  private readonly invites = inject(InviteService);
  private readonly sql = inject(SqlApiService);

  ngOnInit(): void {
    void this.loadProfile();
    void this.loadCommunities();
  }

  muestraPendientes(): boolean {
    return this.session.isAdmin() || this.communities().some((community) => community.userRole === 'narrator');
  }

  get displayName(): string {
    const user = this.auth.user();
    const metadata = user?.user_metadata;
    const metadataName = typeof metadata?.['display_name'] === 'string'
      ? metadata['display_name']
      : typeof metadata?.['full_name'] === 'string'
        ? metadata['full_name']
        : typeof metadata?.['name'] === 'string'
          ? metadata['name']
          : '';
    return this.profile()?.display_name?.trim()
      || metadataName.trim()
      || user?.email?.split('@')[0]
      || 'Aventurero';
  }

  async joinWithInviteCode(): Promise<void> {
    if (this.invite.pending) {
      return;
    }
    const code = this.invite.getRawValue().trim();
    if (!code || this.inviteLoading()) {
      this.inviteIsError.set(!code);
      this.inviteStatus.set(code ? '' : 'Introduce un código de invitación para continuar.');
      return;
    }

    const previousIds = new Set(this.communities().map((community) => community.id));
    this.inviteLoading.set(true);
    this.inviteIsError.set(false);
    this.inviteStatus.set('');

    try {
      const serverId = await this.invites.join(code);
      this.community.invalidate();
      await this.loadCommunities(false);
      const joined = this.communities().find((community) => community.id === serverId);
      const name = joined?.name ?? 'la comunidad';
      this.inviteIsError.set(false);
      this.inviteStatus.set(previousIds.has(serverId)
        ? `Ya pertenecías a ${name}.`
        : `Te has unido a ${name}.`);
      if (!previousIds.has(serverId)) {
        this.invite.reset('');
      }
    } catch (error: unknown) {
      this.inviteIsError.set(true);
      this.inviteStatus.set(error instanceof Error
        ? error.message
        : 'No se pudo usar el código de invitación.');
    } finally {
      this.inviteLoading.set(false);
    }
  }

  private async loadProfile(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.profileLoading.set(false);
      return;
    }

    try {
      await this.session.ensure();
      this.profile.set(this.session.profile());
    } catch {
      this.profileError.set('No se pudo consultar tu perfil en Supabase. Comprueba los permisos de acceso y vuelve a intentarlo.');
    } finally {
      this.profileLoading.set(false);
    }
  }

  private async loadCommunities(showLoading = true): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.communitiesLoading.set(false);
      return;
    }

    if (showLoading) {
      this.communitiesLoading.set(true);
    }

    try {
      const [memberships, servers] = await Promise.all([
        firstValueFrom(this.sql.get<Array<{ server_id: string; role: CommunityRole }>>(`server_members?select=server_id,role&user_id=eq.${user.id}`)),
        firstValueFrom(this.sql.get<Array<{ id: string; name: string; description: string | null; theme: ThemePalette; created_by: string | null }>>('servers?select=id,name,description,theme,created_by&order=name.asc')),
      ]);
      const roles = new Map(memberships.map((row) => [row.server_id, row.role]));
      const result: CommunityServer[] = servers
        .filter((server) => roles.has(server.id))
        .map((server) => ({
          id: server.id,
          name: server.name,
          slug: '',
          description: server.description,
          theme: server.theme,
          userRole: roles.get(server.id) ?? null,
          createdBy: server.created_by,
        }));
      this.communities.set(result);
      this.communitiesError.set('');
      await this.loadAgenda(servers, result);
    } catch (error: unknown) {
      this.communitiesError.set(error instanceof Error
        ? `No se pudo cargar la lista de comunidades: ${error.message}`
        : 'No se pudo cargar la lista de comunidades. Comprueba la conexión y los permisos de Supabase.');
    } finally {
      this.communitiesLoading.set(false);
    }
  }

  private async loadAgenda(
    servers: Array<{ id: string; name: string }>,
    communities: CommunityServer[],
  ): Promise<void> {
    this.agendaLoading.set(true);
    this.upcomingError.set('');
    try {
      const names = new Map(servers.map((server) => [server.id, server.name]));
      const mine = new Set(communities.map((community) => community.id));
      const narratorIds = new Set(communities.filter((community) => community.userRole === 'narrator').map((community) => community.id));
      const [events, characters] = await Promise.all([
        firstValueFrom(this.sql.get<Array<{ id: string; server_id: string; title: string; starts_at: string }>>('events?select=id,server_id,title,starts_at&order=starts_at.asc')),
        firstValueFrom(this.sql.get<Array<{ server_id: string; status: string }>>('characters?select=server_id,status&status=eq.pending')),
      ]);
      const now = Date.now();
      this.upcoming.set(events
        .filter((event) => mine.has(event.server_id) && new Date(event.starts_at).getTime() >= now)
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          title: event.title,
          when: new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.starts_at)),
          serverName: names.get(event.server_id) ?? 'Comunidad',
        })));
      const visibles = this.session.isAdmin() ? characters : characters.filter((row) => narratorIds.has(row.server_id));
      this.pendingCharacters.set(visibles.length);
    } catch (error: unknown) {
      this.upcomingError.set(error instanceof Error ? error.message : 'No se pudieron cargar las próximas sesiones.');
    } finally {
      this.agendaLoading.set(false);
    }
  }
}
