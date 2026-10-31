import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular';
import { CommunityServer } from '../../core/models/community.models';
import { ThemePalette } from '../../core/models/database.types';
import { normalizeTheme, THEME_PRESETS } from '../../core/models/theme-presets';
import { CommunityService } from '../../core/services/community.service';
import { InviteService } from '../../core/services/invite.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { AnnouncementItem, AnnouncementService } from '../../core/services/announcement.service';
import { PuedeDirective } from '../../shared/directives/puede.directive';
import { temaAccesible } from '../../shared/utils/contrast';
import { buildThemePreview, ThemePreviewStyles } from '../../shared/utils/theme-preview';
import { slugAvailable } from '../../shared/validators/async-validators';
import { CommunityRacesComponent } from './community-races.component';

/** Edición de datos, tema, borrado e invitación de una comunidad. */
@Component({
  selector: 'app-community-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommunityRacesComponent, IonButton, NgStyle, PuedeDirective, ReactiveFormsModule],
  templateUrl: './community-editor.component.html',
  styleUrl: './community-editor.component.scss',
})
/** Edición de datos, tema, anuncios, invitación y borrado. */
export class CommunityEditorComponent implements OnInit {
  readonly server = input.required<CommunityServer>();
  readonly changed = output<CommunityServer>();

  readonly presets = THEME_PRESETS;
  private readonly formBuilder = inject(FormBuilder);
  readonly details = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', Validators.maxLength(500)],
  });
  readonly themeForm = this.formBuilder.nonNullable.group({
    primary: ['#b97650'],
    secondary: ['#d19367'],
    accent: ['#f0d2b4'],
    background: ['#10191e'],
    surface: ['#172329'],
    backgroundStyle: ['tint' as 'solid' | 'tint' | 'gradient'],
    preset: ['Oro'],
  });
  readonly announcement = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
  });
  readonly announcements = signal<AnnouncementItem[]>([]);
  readonly confirmName = signal('');
  readonly inviteCode = signal<string | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly themePreview = signal<ThemePreviewStyles>(buildThemePreview(THEME_PRESETS[0]));

  private readonly destroyRef = inject(DestroyRef);

  private readonly communities = inject(CommunityService);
  private readonly invites = inject(InviteService);
  private readonly theme = inject(ThemeService);
  private readonly store = inject(CommunityStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly announcementsApi = inject(AnnouncementService);

  ngOnInit(): void {
    this.details.controls.name.addAsyncValidators(slugAvailable(this.communities, () => this.server().id));
    this.resetDrafts();
    this.themePreview.set(buildThemePreview(normalizeTheme(this.themeForm.getRawValue())));
    this.themeForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.themePreview.set(buildThemePreview(normalizeTheme(this.themeForm.getRawValue())));
    });
    void this.loadInvite();
    void this.loadAnnouncements();
  }

  canEdit(): boolean {
    return this.store.can('editar-comunidad');
  }

  canDelete(): boolean {
    return this.store.can('eliminar-comunidad', this.session.user()?.id === this.server().createdBy);
  }

  previewStyles(): ThemePreviewStyles {
    return this.themePreview();
  }

  setText(field: 'name' | 'description' | 'confirm', event: Event): void {
    const value = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      ? event.target.value
      : '';
    if (field === 'confirm') {
      this.confirmName.set(value);
    }
  }

  applyPreset(theme: ThemePalette): void {
    const normalized = normalizeTheme(theme);
    this.themeForm.patchValue({
      primary: normalized.primary ?? '#b97650',
      secondary: normalized.secondary ?? '#d19367',
      accent: normalized.accent ?? '#f0d2b4',
      background: normalized.background ?? '#10191e',
      surface: normalized.surface ?? '#172329',
      backgroundStyle: normalized.backgroundStyle ?? 'tint',
      preset: normalized.preset ?? 'Personalizado',
    });
    this.themePreview.set(buildThemePreview(normalized));
  }

  async saveDetails(): Promise<void> {
    if (this.details.invalid || this.details.pending) {
      this.details.markAllAsTouched();
      return;
    }
    await this.persist(normalizeTheme(this.server().theme), 'Datos de la comunidad guardados.');
  }

  async saveTheme(): Promise<void> {
    const theme = normalizeTheme(this.themeForm.getRawValue());
    if (!temaAccesible(theme)) {
      this.error.set('Esa paleta no alcanza el contraste en modo claro y en modo oscuro. Elige un preset u oscurece el fondo y aclara el color principal.');
      return;
    }
    await this.persist(theme, 'Tema guardado correctamente.');
    this.theme.apply(theme);
  }

  async publishAnnouncement(): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || this.announcement.invalid) {
      this.announcement.markAllAsTouched();
      return;
    }
    const raw = this.announcement.getRawValue();
    this.error.set('');
    try {
      await this.announcementsApi.publish(this.server().id, userId, raw.title, raw.content);
      this.announcement.reset();
      this.message.set('Anuncio publicado.');
      await this.loadAnnouncements();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo publicar el anuncio.');
    }
  }

  async removeAnnouncement(id: string): Promise<void> {
    this.error.set('');
    try {
      await this.announcementsApi.remove(id);
      this.message.set('Anuncio eliminado.');
      await this.loadAnnouncements();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo borrar el anuncio.');
    }
  }

  async regenerate(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      this.inviteCode.set(await this.invites.regenerate(this.server().id));
      this.message.set('Código nuevo generado.');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo generar el código.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeCommunity(): Promise<void> {
    if (this.confirmName().trim() !== this.server().name) {
      this.error.set('Escribe el nombre exacto de la comunidad para eliminarla.');
      return;
    }
    this.saving.set(true);
    try {
      await this.communities.remove(this.server().id);
      this.store.invalidate();
      await this.router.navigateByUrl('/servers');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo eliminar la comunidad.');
      this.saving.set(false);
    }
  }

  private async loadAnnouncements(): Promise<void> {
    try {
      this.announcements.set(await this.announcementsApi.list(this.server().id));
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar los anuncios.');
    }
  }

  private async persist(theme: ThemePalette, success: string): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await this.communities.update(this.server().id, {
        name: this.details.controls.name.value,
        description: this.details.controls.description.value,
        theme,
      });
      const next = {
        ...this.server(),
        name: this.details.controls.name.value.trim(),
        description: this.details.controls.description.value.trim() || null,
        theme,
      };
      this.changed.emit(next);
      this.message.set(success);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      this.saving.set(false);
    }
  }

  private resetDrafts(): void {
    this.details.patchValue({ name: this.server().name, description: this.server().description ?? '' });
    const theme = normalizeTheme(this.server().theme);
    this.themeForm.patchValue({
      primary: theme.primary ?? '#b97650',
      secondary: theme.secondary ?? '#d19367',
      accent: theme.accent ?? '#f0d2b4',
      background: theme.background ?? '#10191e',
      surface: theme.surface ?? '#172329',
      backgroundStyle: theme.backgroundStyle ?? 'tint',
      preset: theme.preset ?? 'Oro',
    });
  }

  private async loadInvite(): Promise<void> {
    if (!this.canEdit()) {
      return;
    }
    try {
      this.inviteCode.set(await this.invites.getCode(this.server().id));
    } catch {
      this.error.set('No se pudo consultar el código de invitación.');
    }
  }
}
