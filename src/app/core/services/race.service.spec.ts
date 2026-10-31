import { avisoDesdeError } from './race.service';

describe('RaceService avisos', () => {
  it('detecta falta de permiso PostgREST con código 42501', () => {
    expect(avisoDesdeError({ message: 'permission denied for table community_races', code: '42501' })).toContain('005');
  });

  it('detecta tabla inexistente sin confundirla con permiso', () => {
    expect(avisoDesdeError({ message: 'relation "community_races" does not exist', code: 'PGRST205' })).toContain('004');
  });

  it('devuelve null en errores de validación', () => {
    expect(avisoDesdeError({ message: 'duplicate key value violates unique constraint', code: '23505' })).toBeNull();
  });

  it('no confunde una columna ausente con la migración 004', () => {
    expect(avisoDesdeError({
      message: "Could not find the 'created_by' column of 'community_races' in the schema cache",
      code: 'PGRST204',
    })).toBeNull();
  });
});
