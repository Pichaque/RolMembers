import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent } from '@ionic/angular';
import { DiceDoc, DocumentStoreService, FeedDoc } from '../../core/services/document-store.service';
import { CommunityService } from '../../core/services/community.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { NotaTablon, TablonEventosComponent } from '../../shared/components/tablon-eventos.component';
import { Tirada, TiradorDadosComponent } from '../../shared/components/tirador-dados.component';

/** Tablón en directo de una comunidad: anuncios, noticias y dados. */
@Component({
  selector: 'app-tablon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tablon.page.html',
  styleUrl: './tablon.page.scss',
  imports: [IonButton, IonContent, RouterLink, TablonEventosComponent, TiradorDadosComponent],
})
/** Noticias y dados en tiempo real de una comunidad. */
export class TablonPage implements OnInit {
  readonly serverId = signal('');
  readonly serverName = signal('');
  readonly feed = signal<FeedDoc[]>([]);
  readonly dice = signal<DiceDoc[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly diceError = signal('');
  private readonly pinColor = signal('#b97650');

  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(DocumentStoreService);
  private readonly communities = inject(CommunityService);
  private readonly theme = inject(ThemeService);
  private readonly store = inject(CommunityStore);
  private readonly session = inject(SessionStore);
  private readonly destroyRef = inject(DestroyRef);
  private stopFeed: (() => void) | null = null;
  private stopDice: (() => void) | null = null;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.stopFeed?.();
      this.stopDice?.();
      this.theme.reset();
      this.store.setActive(null);
    });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const serverId = params.get('id') ?? '';
      this.stopFeed?.();
      this.stopDice?.();
      this.serverId.set(serverId);
      this.store.setActive(serverId || null);
      void this.load(serverId);
    });
  }

  anuncios(): FeedDoc[] {
    return this.feed().filter((item) => item.kind === 'announcement');
  }

  noticias(): FeedDoc[] {
    return this.feed().filter((item) => item.kind !== 'announcement');
  }

  notasAnuncios(): NotaTablon[] {
    return this.notasDesde(this.anuncios(), 'Todavía no hay anuncios');
  }

  notasFeed(): NotaTablon[] {
    return this.notasDesde(this.noticias(), 'Todavía no hay noticias');
  }

  private notasDesde(items: FeedDoc[], vacio: string): NotaTablon[] {
    if (!items.length) {
      return [{ id: `empty-${vacio}`, titulo: vacio, detalle: '', comunidad: '', color: this.pinColor() }];
    }
    return items.map((item) => ({
      id: item.id,
      titulo: item.title,
      detalle: item.detail ?? '',
      comunidad: this.serverName(),
      color: this.pinColor(),
    }));
  }

  historial() {
    return this.dice().map((item) => ({ sides: item.sides, result: item.result, label: item.label }));
  }

  async guardarTirada(tirada: Tirada): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || !this.store.can('tirar-dados')) {
      this.diceError.set('Solo los miembros de la comunidad pueden tirar dados.');
      return;
    }
    this.diceError.set('');
    try {
      await this.documents.addDice(this.serverId(), userId, tirada);
    } catch (error: unknown) {
      this.diceError.set(error instanceof Error ? error.message : 'No se pudo guardar la tirada.');
    }
  }

  private async load(serverId: string): Promise<void> {
    if (!serverId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.session.ensure();
      await this.store.ensureLoaded();
      const user = this.session.user();
      if (!user) {
        this.error.set('Necesitas iniciar sesión.');
        return;
      }
      const [details, feed, dice] = await Promise.all([
        this.communities.getDetails(serverId, user.id),
        this.documents.listFeed(serverId, 50),
        this.documents.listDice(serverId),
      ]);
      if (!details) {
        throw new Error('No se encontró la comunidad.');
      }
      this.serverName.set(details.name);
      this.theme.apply(details.theme);
      const primary = globalThis.getComputedStyle(document.documentElement).getPropertyValue('--community-primary').trim();
      this.pinColor.set(primary || details.theme.primary || '#b97650');
      this.feed.set(feed);
      this.dice.set(dice);
      this.stopFeed = this.documents.watchFeed(serverId, (doc) => {
        this.feed.update((current) => [doc, ...current.filter((item) => item.id !== doc.id)].slice(0, 50));
      });
      this.stopDice = this.documents.watchDice(serverId, (doc) => {
        this.dice.update((current) => [doc, ...current.filter((item) => item.id !== doc.id)].slice(0, 20));
      });
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo abrir el tablón.');
    } finally {
      this.loading.set(false);
    }
  }
}
