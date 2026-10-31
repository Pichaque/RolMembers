import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular';
import { CommunityMember, CommunityServer } from '../../core/models/community.models';
import { characterStatusLabel, communityRoleLabel, CommunityRole } from '../../core/models/database.types';
import { CharacterService } from '../../core/services/character.service';
import { MemberService } from '../../core/services/member.service';
import { downloadCsv } from '../../core/utils/csv';
import { CommunityStore } from '../../core/stores/community.store';
import { SessionStore } from '../../core/stores/session.store';
import { PuedeDirective } from '../../shared/directives/puede.directive';
import { characterNameAvailable } from '../../shared/validators/async-validators';
import { ExportarInformeComponent } from '../../shared/components/exportar-informe.component';
import { FichaPersonajeComponent } from '../../shared/components/ficha-personaje.component';

/** Lista de miembros, cambios de rol y alta de personaje. */
@Component({
  selector: 'app-community-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExportarInformeComponent, FichaPersonajeComponent, IonButton, IonSpinner, PuedeDirective, ReactiveFormsModule],
  templateUrl: './community-roster.component.html',
  styleUrl: './community-roster.component.scss',
})
/** Miembros, roles y fichas de una comunidad. */
export class CommunityRosterComponent {
  readonly server = input.required<CommunityServer>();
  readonly members = input.required<CommunityMember[]>();
  readonly changed = output<void>();

  private readonly formBuilder = inject(FormBuilder);
  readonly characterName = this.formBuilder.nonNullable.control('', {
    validators: [Validators.required, Validators.maxLength(80)],
    asyncValidators: [characterNameAvailable(inject(CharacterService), () => this.server().id)],
  });
  readonly error = signal('');
  readonly success = signal('');
  readonly saving = signal(false);
  readonly roleLabel = communityRoleLabel;
  readonly statusLabel = characterStatusLabel;

  private readonly membersApi = inject(MemberService);
  private readonly characters = inject(CharacterService);
  private readonly session = inject(SessionStore);
  readonly store = inject(CommunityStore);

  print(): void {
    globalThis.print();
  }

  filas(): string[][] {
    return this.members().map((member) => [
      member.displayName,
      this.roleLabel(member.role),
      member.characters.map((character) => character.name).join('; ') || 'Sin personaje',
    ]);
  }

  filasMiembros() {
    return this.members().map((member) => ({
      id: member.userId,
      celdas: [member.displayName, this.roleLabel(member.role)],
    }));
  }

  readonly personajesEnComunidad = computed(() =>
    this.members().flatMap((member) =>
      member.characters.map((character) => ({ member, character })),
    ),
  );

  canManage(member: CommunityMember): boolean {
    return this.store.can('gestionar-miembros') && member.userId !== this.server().createdBy;
  }

  exportMembers(): void {
    downloadCsv(
      `${this.server().name}-miembros.csv`,
      ['Usuario', 'Rol', 'Personajes'],
      this.members().map((member) => [
        member.displayName,
        this.roleLabel(member.role),
        member.characters.map((character) => character.name).join('; ') || 'Sin personaje',
      ]),
    );
  }

  async changeRole(member: CommunityMember, event: Event): Promise<void> {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const role = event.target.value;
    if ((role !== 'narrator' && role !== 'player') || role === member.role) {
      return;
    }
    await this.run(() => this.membersApi.updateRole(this.server().id, member.userId, role as CommunityRole));
  }

  async remove(member: CommunityMember): Promise<void> {
    if (!globalThis.confirm(`¿Expulsar a ${member.displayName}?`)) {
      return;
    }
    await this.run(() => this.membersApi.remove(this.server().id, member.userId));
  }

  async setStatus(characterId: string, status: 'approved' | 'rejected'): Promise<void> {
    await this.run(() => this.characters.setStatus(characterId, status));
  }

  async createCharacter(): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId) {
      return;
    }
    this.saving.set(true);
    try {
      if (this.characterName.invalid || this.characterName.pending) {
        this.characterName.markAsTouched();
        return;
      }
      await this.characters.create(this.server().id, userId, this.characterName.getRawValue());
      this.characterName.reset('');
      this.success.set('Personaje enviado. Queda pendiente hasta que el narrador lo revise.');
      this.changed.emit();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo crear el personaje.');
    } finally {
      this.saving.set(false);
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await action();
      this.changed.emit();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo completar la acción.');
    }
  }
}
