import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { toCommunitySlug } from '../../core/services/supabase-errors';
import { CharacterService } from '../../core/services/character.service';
import { CommunityService } from '../../core/services/community.service';
import { InviteService } from '../../core/services/invite.service';
import { CalendarService } from '../../core/services/calendar.service';

/** Espera y luego ejecuta la comprobación remota. */
export function debouncedAsyncValidator(
  check: (value: string) => Promise<ValidationErrors | null>,
  ms = 400,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return of(null);
    }
    return timer(ms).pipe(
      switchMap(() => check(value)),
      catchError(() => of({ unavailable: true })),
    );
  };
}

/** El slug derivado del nombre tiene el formato de la base y no está ocupado. */
export function slugAvailable(communities: CommunityService, excludeId?: () => string | undefined): AsyncValidatorFn {
  return debouncedAsyncValidator(async (value) => {
    const slug = toCommunitySlug(value);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      return { slug: true };
    }
    const taken = await communities.slugTaken(slug, excludeId?.());
    return taken ? { slugTaken: true } : null;
  });
}

/** Nombre de personaje libre. `excludeId` usa `p_exclude` al editar. */
export function characterNameAvailable(
  characters: CharacterService,
  serverId: () => string,
  excludeId?: () => string | undefined,
): AsyncValidatorFn {
  return debouncedAsyncValidator(async (value) => {
    const available = await characters.nameAvailable(serverId(), value, excludeId?.());
    return available ? null : { characterName: true };
  });
}

/** El código existe según `invite_code_valid`. */
export function inviteCodeValid(invites: InviteService): AsyncValidatorFn {
  return debouncedAsyncValidator(async (value) => {
    const valid = await invites.isValid(value);
    return valid ? null : { inviteCode: true };
  });
}

/**
 * El lugar no choca con otro evento. Pasa `excludeId` al editar (`p_exclude`).
 */
export function eventNoConflict(calendar: CalendarService, excludeId?: () => string | undefined): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const place = String(control.get('place')?.value ?? '').trim();
    const startsAt = String(control.get('startsAt')?.value ?? '');
    const endsAt = String(control.get('endsAt')?.value ?? '');
    if (!place || !startsAt || !endsAt) {
      return of(null);
    }
    return timer(400).pipe(
      switchMap(() => calendar.hasConflict(place, new Date(startsAt).toISOString(), new Date(endsAt).toISOString(), excludeId?.())),
      map((conflict) => (conflict ? { eventConflict: true } : null)),
      catchError(() => of({ unavailable: true })),
    );
  };
}

/** Las dos contraseñas del registro tienen que coincidir. */
export const passwordsMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!control.get('confirmPassword') || confirm === '' || confirm === null) {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
};
