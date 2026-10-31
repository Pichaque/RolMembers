import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { CommunityMember, CommunityServer } from '../../core/models/community.models';
import { communityRoleLabel } from '../../core/models/database.types';
import { AuthService } from '../../core/services/auth.service';
import { CommunityService } from '../../core/services/community.service';
import { MemberService } from '../../core/services/member.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommunityStore } from '../../core/stores/community.store';
import { CommunityEditorComponent } from './community-editor.component';
import { CommunityRosterComponent } from './community-roster.component';

/** Detalle de una comunidad. La edición vive en los subcomponentes. */
@Component({
  selector: 'app-server-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './server-detail.page.html',
  styleUrl: './server-detail.page.scss',
  imports: [CommunityEditorComponent, CommunityRosterComponent, IonButton, IonContent, IonIcon, RouterLink],
})
/** Detalle de una comunidad y su tema. */
export class ServerDetailPage implements OnInit, OnDestroy {
  readonly serverId = signal('');
  readonly server = signal<CommunityServer | null>(null);
  readonly members = signal<CommunityMember[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly roleLabel = communityRoleLabel;
  readonly descriptionExpanded = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly communities = inject(CommunityService);
  private readonly membersApi = inject(MemberService);
  private readonly theme = inject(ThemeService);
  private readonly store = inject(CommunityStore);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const serverId = params.get('id') ?? '';
      this.serverId.set(serverId);
      this.store.setActive(serverId || null);
      this.loading.set(Boolean(serverId));
      this.error.set('');
      if (!serverId) {
        this.error.set('Falta el identificador de la comunidad.');
        return;
      }
      void this.load(serverId);
    });
  }

  ngOnDestroy(): void {
    this.theme.reset();
    this.store.setActive(null);
  }

  onServerChange(server: CommunityServer): void {
    this.server.set(server);
  }

  async reloadMembers(): Promise<void> {
    const serverId = this.serverId();
    if (!serverId) {
      return;
    }
    this.members.set(await this.membersApi.list(serverId));
  }

  toggleDescription(): void {
    this.descriptionExpanded.update((value) => !value);
  }

  needsDescriptionToggle(description: string | null): boolean {
    const text = (description ?? 'Sin descripción disponible.').trim();
    return text.length > 280;
  }

  private async load(serverId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.error.set('Necesitas iniciar sesión para ver esta comunidad.');
      this.loading.set(false);
      return;
    }
    try {
      const [details, members] = await Promise.all([
        this.communities.getDetails(serverId, user.id),
        this.membersApi.list(serverId),
      ]);
      if (this.serverId() !== serverId) {
        return;
      }
      if (!details) {
        this.error.set('No se encontró la comunidad.');
        return;
      }
      this.server.set(details);
      this.members.set(members);
      this.theme.apply(details.theme);
    } catch (error: unknown) {
      if (this.serverId() === serverId) {
        this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la comunidad.');
      }
    } finally {
      if (this.serverId() === serverId) {
        this.loading.set(false);
      }
    }
  }
}
