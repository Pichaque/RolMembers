import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { CommunityServer } from '../../core/models/community.models';
import { CommunityService } from '../../core/services/community.service';
import { InviteService } from '../../core/services/invite.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { communityRoleLabel, ThemePalette } from '../../core/models/database.types';
import { normalizeTheme, THEME_PRESETS } from '../../core/models/theme-presets';
import { BuscadorComponent } from '../../shared/components/buscador.component';
import { inviteCodeValid, slugAvailable } from '../../shared/validators/async-validators';

@Component({
  selector: 'app-servers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servers.page.html',
  styleUrl: './servers.page.scss',
  imports: [BuscadorComponent, IonButton, IonContent, IonIcon, IonSpinner, NgStyle, ReactiveFormsModule, RouterLink],
})
/** Listado y alta de comunidades. */
export class ServersPage implements OnInit {
  readonly servers = signal<CommunityServer[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly inviteStatus = signal('');
  readonly inviteIsError = signal(false);
  readonly inviteLoading = signal(false);
  readonly roleLabel = communityRoleLabel;
  readonly presets = THEME_PRESETS;
  readonly creationError = signal('');
  readonly creationSuccess = signal('');
  readonly createdCount = signal(0);
  readonly canCreateServer = signal(false);
  readonly creationPermissionError = signal('');
  filtro = '';

  private readonly auth = inject(AuthService);
  private readonly communities = inject(CommunityService);
  private readonly invites = inject(InviteService);
  private readonly session = inject(SessionStore);
  private readonly communityStore = inject(CommunityStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly initialTheme = normalizeTheme(THEME_PRESETS[0]);
  readonly invite = this.formBuilder.nonNullable.control('', { asyncValidators: [inviteCodeValid(this.invites)] });
  readonly creation = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)], [slugAvailable(this.communities)]],
    description: ['', Validators.maxLength(500)],
    primary: [this.initialTheme.primary ?? '#b97650'],
    secondary: [this.initialTheme.secondary ?? '#d19367'],
    accent: [this.initialTheme.accent ?? '#f0d2b4'],
    background: [this.initialTheme.background ?? '#10191e'],
    surface: [this.initialTheme.surface ?? '#172329'],
    backgroundStyle: ['tint' as 'solid' | 'tint' | 'gradient'],
    preset: [this.initialTheme.preset ?? 'Oro'],
  });

  ngOnInit(): void {
    void this.loadServers();
  }

  matches(server: CommunityServer): boolean {
    const query = this.filtro.trim().toLowerCase();
    return !query || server.name.toLowerCase().includes(query);
  }

  async joinServer(): Promise<void> {
    const code = this.invite.getRawValue().trim();
    if (this.invite.pending) {
      return;
    }
    if (!code || this.inviteLoading()) {
      this.inviteIsError.set(!code);
      this.inviteStatus.set(code ? '' : 'Introduce un código de invitación para continuar.');
      return;
    }

    const previousIds = new Set(this.servers().map((server) => server.id));
    this.inviteLoading.set(true);
    this.inviteIsError.set(false);
    this.inviteStatus.set('');

    try {
      const serverId = await this.invites.join(code);
      this.communityStore.invalidate();
      await this.loadServers(false);
      const joined = this.servers().find((server) => server.id === serverId);
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

  themePreviewStyle(): Record<string, string> {
    const palette = this.creation.getRawValue();
    const background = this.getSafeColor(palette.background, '#10191e');
    const primary = this.getSafeColor(palette.primary, '#b97650');
    const secondary = this.getSafeColor(palette.secondary, '#d19367');
    if (palette.backgroundStyle === 'solid') {
      return { background };
    }
    if (palette.backgroundStyle === 'gradient') {
      return { background: `linear-gradient(160deg, ${background}, ${secondary}, ${primary})` };
    }
    return { background: `radial-gradient(circle at 80% 0%, ${primary}, ${background} 55%)` };
  }

  serverThemeStyle(theme: ThemePalette | null): string {
    return `linear-gradient(135deg, ${this.getSafeColor(theme?.primary, '#b97650')} 0%, ${this.getSafeColor(theme?.secondary, '#d19367')} 100%)`;
  }

  applyPreset(theme: ThemePalette): void {
    const normalized = normalizeTheme(theme);
    this.creation.patchValue({
      primary: normalized.primary ?? '#b97650',
      secondary: normalized.secondary ?? '#d19367',
      accent: normalized.accent ?? '#f0d2b4',
      background: normalized.background ?? '#10191e',
      surface: normalized.surface ?? '#172329',
      backgroundStyle: normalized.backgroundStyle ?? 'tint',
      preset: normalized.preset ?? 'Personalizado',
    });
  }

  async createCommunity(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.creationError.set('Necesitas iniciar sesión para crear una comunidad.');
      return;
    }

    if (this.creation.invalid || this.creation.pending) {
      this.creation.markAllAsTouched();
      return;
    }
    const raw = this.creation.getRawValue();
    const name = raw.name.trim();

    if (!this.canCreateServer() && this.createdCount() >= 3) {
      this.creationError.set('Has alcanzado el límite de 3 comunidades creadas.');
      return;
    }

    try {
      const created = await this.communities.create({
        name,
        description: raw.description.trim() || null,
        theme: normalizeTheme(raw),
      });
      this.communityStore.invalidate();

      this.creationError.set('');
      this.creationSuccess.set('Comunidad creada. Ya apareces como narrador.');
      this.creation.controls.name.reset('');
      this.creation.controls.description.reset('');
      await this.loadServers();
      if (this.error()) {
        this.creationSuccess.set('La comunidad se creó, pero no se pudo actualizar la lista. Inténtalo de nuevo más tarde.');
      } else if (!this.servers().some((server) => server.id === created.id)) {
        this.creationSuccess.set('La comunidad se creó, pero no aparece en tu lista de membresías. Comprueba si Supabase añade al creador a server_members.');
      }
    } catch (error: unknown) {
      this.creationSuccess.set('');
      this.creationError.set(error instanceof Error ? error.message : 'No se pudo crear la comunidad. Revisa los permisos y la tabla servers.');
    }
  }

  private async loadServers(showLoading = true): Promise<void> {
    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set('');
    this.canCreateServer.set(false);
    this.creationPermissionError.set('');
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.inviteStatus.set('');

    try {
      const communities = await this.communities.listForUser(user.id);
      this.servers.set(communities);
    } catch (error: unknown) {
      this.servers.set([]);
      this.error.set(error instanceof Error
        ? `No se pudo consultar la lista de comunidades: ${error.message}`
        : 'No se pudo consultar la lista de comunidades. Comprueba la conexión y los permisos de Supabase.');
    } finally {
      this.loading.set(false);
    }

    try {
      await this.session.ensure();
      this.canCreateServer.set(this.session.isAdmin());
      this.createdCount.set(await this.communities.countCreated(user.id));
      this.creationPermissionError.set('');
    } catch {
      this.canCreateServer.set(false);
      this.creationPermissionError.set('No se pudo comprobar cuántas comunidades has creado.');
    }
  }

  private getSafeColor(value: unknown, fallback: string): string {
    if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
      return fallback;
    }

    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value;
  }
}
