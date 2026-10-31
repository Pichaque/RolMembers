import { AbstractControl, ValidationErrors } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { CalendarService } from '../../core/services/calendar.service';
import { CharacterService } from '../../core/services/character.service';
import { CommunityService } from '../../core/services/community.service';
import { InviteService } from '../../core/services/invite.service';
import { characterNameAvailable, eventNoConflict, inviteCodeValid, slugAvailable } from './async-validators';

describe('validadores asíncronos', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca el slug ocupado y acepta uno libre', async () => {
    vi.useFakeTimers();
    const ocupado = esperar(slugAvailable({ slugTaken: async () => true } as unknown as CommunityService)(control('Mesa Uno')));
    const libre = esperar(slugAvailable({ slugTaken: async () => false } as unknown as CommunityService)(control('Otra Mesa')));
    await vi.advanceTimersByTimeAsync(400);
    await expect(ocupado).resolves.toEqual({ slugTaken: true });
    await expect(libre).resolves.toBeNull();
  });

  it('comprueba nombre, invitación y conflicto de evento', async () => {
    vi.useFakeTimers();
    const nombre = esperar(characterNameAvailable({ nameAvailable: async () => false } as unknown as CharacterService, () => 'srv')(control('Aria')));
    const codigo = esperar(inviteCodeValid({ isValid: async () => false } as unknown as InviteService)(control('NO')));
    const evento = esperar(eventNoConflict({ hasConflict: async () => true } as unknown as CalendarService)(grupo()));
    await vi.advanceTimersByTimeAsync(400);
    await expect(nombre).resolves.toEqual({ characterName: true });
    await expect(codigo).resolves.toEqual({ inviteCode: true });
    await expect(evento).resolves.toEqual({ eventConflict: true });
  });
});

function control(value: string): AbstractControl {
  return { value } as AbstractControl;
}

function grupo(): AbstractControl {
  return {
    get: (name: string) => ({ value: name === 'place' ? 'Taberna' : '2026-05-01T18:00' }),
  } as AbstractControl;
}

function esperar(result: Promise<ValidationErrors | null> | Observable<ValidationErrors | null>): Promise<ValidationErrors | null> {
  return result instanceof Promise ? result : firstValueFrom(result);
}
