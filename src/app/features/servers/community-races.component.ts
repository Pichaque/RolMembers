import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton } from '@ionic/angular';
import { CommunityServer } from '../../core/models/community.models';
import { CommunityRace, RaceService } from '../../core/services/race.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';

/** El narrador define razas y rasgos disponibles para los personajes. */
@Component({
  selector: 'app-community-races',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, ReactiveFormsModule],
  templateUrl: './community-races.component.html',
  styleUrl: './community-races.component.scss',
})
export class CommunityRacesComponent implements OnInit {
  readonly server = input.required<CommunityServer>();

  readonly races = signal<CommunityRace[]>([]);
  readonly notice = signal('');
  readonly error = signal('');
  readonly saving = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  readonly draft = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    traits: ['', Validators.required],
  });

  private readonly racesApi = inject(RaceService);
  private readonly store = inject(CommunityStore);
  private readonly session = inject(SessionStore);

  ngOnInit(): void {
    void this.reload();
  }

  canManage(): boolean {
    return this.store.can('editar-comunidad');
  }

  async reload(): Promise<void> {
    if (!this.canManage()) {
      return;
    }
    this.error.set('');
    try {
      const result = await this.racesApi.listOrEmpty(this.server().id);
      this.races.set(result.races);
      this.notice.set(result.notice);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar las razas.');
    }
  }

  async createRace(): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || this.draft.invalid) {
      this.draft.markAllAsTouched();
      return;
    }
    const raw = this.draft.getRawValue();
    const traits = raw.traits.split(',').map((item) => item.trim()).filter(Boolean);
    if (!traits.length) {
      this.error.set('Escribe al menos un rasgo separado por comas.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      await this.racesApi.create(this.server().id, userId, raw.name, traits);
      this.draft.reset();
      await this.reload();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo crear la raza.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeRace(id: string): Promise<void> {
    if (!globalThis.confirm('¿Borrar esta raza? Los personajes ya creados conservan sus rasgos guardados.')) {
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      await this.racesApi.remove(id);
      await this.reload();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo borrar la raza.');
    } finally {
      this.saving.set(false);
    }
  }
}
