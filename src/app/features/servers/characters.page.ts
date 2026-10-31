import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { characterStatusLabel } from '../../core/models/database.types';
import { CharacterRecord, CharacterService, CharacterSheet, sheetToJson } from '../../core/services/character.service';
import { CommunityService } from '../../core/services/community.service';
import { PortraitService } from '../../core/services/portrait.service';
import { CommunityRace, RaceService } from '../../core/services/race.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { ExportarInformeComponent } from '../../shared/components/exportar-informe.component';
import { FichaPersonajeComponent, PersonajeVista } from '../../shared/components/ficha-personaje.component';
import { characterNameAvailable } from '../../shared/validators/async-validators';

/** Alta y revisión de personajes de una comunidad. */
@Component({
  selector: 'app-characters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './characters.page.html',
  styleUrl: './characters.page.scss',
  imports: [ExportarInformeComponent, FichaPersonajeComponent, IonButton, IonContent, IonSpinner, ReactiveFormsModule, RouterLink],
})
/** Alta, edición y aprobación de personajes de una comunidad. */
export class CharactersPage implements OnInit, OnDestroy {
  readonly serverId = signal('');
  readonly serverName = signal('');
  readonly characters = signal<CharacterRecord[]>([]);
  readonly races = signal<CommunityRace[]>([]);
  readonly featuresNotice = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editingId = signal<string | null>(null);
  readonly statusLabel = characterStatusLabel;
  readonly retratoPreview = signal<string | null>(null);
  readonly retratoNombre = signal('');
  readonly rasgosMarcados = signal<Set<string>>(new Set());

  private readonly retratoInput = viewChild<ElementRef<HTMLInputElement>>('retratoInput');

  private portraitFile: File | null = null;

  private readonly formBuilder = inject(FormBuilder);
  readonly ficha = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    raceId: [''],
    profesion: [''],
    edad: [''],
    aspecto: [''],
    historia: [''],
    rasgos: this.formBuilder.nonNullable.array([this.formBuilder.nonNullable.control('', Validators.required)]),
  });

  readonly selectedRace = computed(() => {
    const raceId = this.ficha.controls.raceId.value;
    return this.races().find((race) => race.id === raceId) ?? null;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly charactersApi = inject(CharacterService);
  private readonly communities = inject(CommunityService);
  private readonly racesApi = inject(RaceService);
  private readonly portraits = inject(PortraitService);
  private readonly theme = inject(ThemeService);
  readonly store = inject(CommunityStore);
  private readonly session = inject(SessionStore);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.ficha.controls.nombre.addAsyncValidators(characterNameAvailable(
      this.charactersApi,
      () => this.serverId(),
      () => this.editingId() ?? undefined,
    ));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const serverId = params.get('id') ?? '';
      this.serverId.set(serverId);
      this.store.setActive(serverId || null);
      void this.load(serverId);
    });
  }

  ngOnDestroy(): void {
    this.theme.reset();
    this.store.setActive(null);
  }

  get rasgos(): FormArray {
    return this.ficha.controls.rasgos;
  }

  filasInforme(): string[][] {
    return this.characters().map((character) => [
      character.name,
      this.statusLabel(character.status),
      character.sheet.profesion,
      character.sheet.rasgos.join(', '),
    ]);
  }

  vistaPersonaje(character: CharacterRecord): PersonajeVista {
    return {
      id: character.id,
      nombre: character.name,
      estado: this.statusLabel(character.status),
      profesion: character.sheet.profesion || undefined,
      rasgos: character.sheet.rasgos,
      retratoUrl: this.portraits.resolvePublicUrl(character.sheet.retrato),
    };
  }

  puedeAprobar(character: CharacterRecord): boolean {
    return this.store.can('aprobar-personaje') && character.status === 'pending';
  }

  puedeEditar(character: CharacterRecord): boolean {
    return character.ownerId === this.session.user()?.id;
  }

  onRaceChange(): void {
    this.rasgosMarcados.set(new Set());
  }

  toggleRaceTrait(trait: string, event: Event): void {
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    this.rasgosMarcados.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(trait);
      } else {
        next.delete(trait);
      }
      return next;
    });
  }

  onPortraitSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }
    const file = input.files[0];
    this.portraitFile = file;
    this.retratoNombre.set(file.name);
    this.retratoPreview.set(URL.createObjectURL(file));
  }

  abrirSelectorRetrato(): void {
    this.retratoInput()?.nativeElement.click();
  }

  addRasgo(): void {
    if (this.rasgos.length >= 5) {
      return;
    }
    this.rasgos.push(this.formBuilder.nonNullable.control('', Validators.required));
  }

  removeRasgo(index: number): void {
    if (this.rasgos.length <= 1) {
      return;
    }
    this.rasgos.removeAt(index);
  }

  editar(id: string): void {
    const character = this.characters().find((item) => item.id === id);
    if (!character || !this.puedeEditar(character)) {
      return;
    }
    this.editingId.set(id);
    this.portraitFile = null;
    this.retratoPreview.set(this.portraits.resolvePublicUrl(character.sheet.retrato));
    const path = character.sheet.retrato;
    this.retratoNombre.set(path ? path.split('/').pop()?.split('.')[0] ?? 'Retrato guardado' : '');
    this.rasgosMarcados.set(new Set(character.sheet.rasgos));
    this.rasgos.clear();
    const rasgos = character.sheet.rasgos.length ? character.sheet.rasgos : [''];
    for (const rasgo of rasgos.slice(0, 5)) {
      this.rasgos.push(this.formBuilder.nonNullable.control(rasgo, Validators.required));
    }
    this.ficha.patchValue({
      nombre: character.name,
      raceId: character.sheet.raceId ?? '',
      profesion: character.sheet.profesion,
      edad: character.sheet.edad === null ? '' : String(character.sheet.edad),
      aspecto: character.sheet.aspecto,
      historia: character.sheet.historia,
    });
  }

  async guardar(): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || this.saving() || this.ficha.pending) {
      return;
    }
    if (this.ficha.invalid) {
      this.ficha.markAllAsTouched();
      return;
    }
    const raw = this.ficha.getRawValue();
    const sheet = this.sheetFrom(raw);
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const editingId = this.editingId();
      let characterId = editingId;
      if (editingId) {
        if (this.portraitFile) {
          sheet.retrato = await this.portraits.upload(this.serverId(), editingId, this.portraitFile);
        }
        await this.charactersApi.update(editingId, raw.nombre, sheet, this.serverId());
        this.message.set('Personaje actualizado.');
      } else {
        characterId = await this.charactersApi.create(this.serverId(), userId, raw.nombre, sheetToJson(sheet));
        if (this.portraitFile && characterId) {
          sheet.retrato = await this.portraits.upload(this.serverId(), characterId, this.portraitFile);
          await this.charactersApi.update(characterId, raw.nombre, sheet, this.serverId());
        }
        this.message.set('Personaje enviado. Queda pendiente de aprobación.');
      }
      this.cancelar();
      await this.load(this.serverId());
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar el personaje.');
    } finally {
      this.saving.set(false);
    }
  }

  async aprobar(id: string): Promise<void> {
    await this.cambiarEstado(id, 'approved');
  }

  async rechazar(id: string): Promise<void> {
    await this.cambiarEstado(id, 'rejected');
  }

  async eliminar(id: string): Promise<void> {
    const character = this.characters().find((item) => item.id === id);
    if (!character || !this.puedeEditar(character)) {
      return;
    }
    this.error.set('');
    try {
      await this.charactersApi.remove(id);
      this.message.set('Personaje eliminado.');
      if (this.editingId() === id) {
        this.cancelar();
      }
      await this.load(this.serverId());
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo eliminar el personaje.');
    }
  }

  cancelar(): void {
    this.editingId.set(null);
    this.portraitFile = null;
    this.retratoPreview.set(null);
    this.retratoNombre.set('');
    this.rasgosMarcados.set(new Set());
    this.rasgos.clear();
    this.rasgos.push(this.formBuilder.nonNullable.control('', Validators.required));
    this.ficha.reset({ raceId: '' });
  }

  private sheetFrom(raw: {
    profesion: string;
    edad: string;
    aspecto: string;
    historia: string;
    rasgos: string[];
    raceId: string;
  }): CharacterSheet {
    const edad = raw.edad.trim() === '' ? null : Number(raw.edad);
    const race = this.selectedRace();
    const rasgos = race
      ? [...this.rasgosMarcados()]
      : raw.rasgos.map((rasgo) => rasgo.trim()).filter(Boolean).slice(0, 5);
    return {
      profesion: raw.profesion.trim(),
      edad: edad !== null && Number.isFinite(edad) ? edad : null,
      aspecto: raw.aspecto.trim(),
      historia: raw.historia.trim(),
      rasgos,
      raceId: race?.id ?? (raw.raceId || null),
      retrato: this.characters().find((item) => item.id === this.editingId())?.sheet.retrato ?? null,
    };
  }

  private async cambiarEstado(id: string, status: 'approved' | 'rejected'): Promise<void> {
    this.error.set('');
    try {
      await this.charactersApi.setStatus(id, status);
      this.message.set(status === 'approved' ? 'Personaje aprobado.' : 'Personaje rechazado.');
      await this.load(this.serverId());
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
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
      const raceResult = await this.racesApi.listOrEmpty(serverId);
      this.races.set(raceResult.races);
      if (raceResult.notice) {
        this.featuresNotice.set(raceResult.notice);
      }
      const [details, list] = await Promise.all([
        this.communities.getDetails(serverId, user.id),
        this.charactersApi.list(serverId),
      ]);
      if (!details) {
        throw new Error('No se encontró la comunidad.');
      }
      this.serverName.set(details.name);
      this.theme.apply(details.theme);
      this.characters.set(list);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar los personajes.');
    } finally {
      this.loading.set(false);
    }
  }
}
