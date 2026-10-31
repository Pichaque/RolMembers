import { puede, PERMISSIONS } from './permissions';

describe('permisos', () => {
  it('deja el calendario a cualquier sesión y niega el panel a un roleador', () => {
    expect(puede('ver-calendario', null, true)).toBe(true);
    expect(puede('ver-admin', 'player', true)).toBe(false);
    expect(puede('crear-evento', 'player', true)).toBe(false);
    expect(puede('crear-evento', 'narrator', true)).toBe(true);
    expect(puede('ver-admin', 'admin', true)).toBe(true);
    expect(puede('eliminar-comunidad', 'narrator', true, true)).toBe(true);
    expect(puede('eliminar-comunidad', 'narrator', true, false)).toBe(false);
    expect(PERMISSIONS['aprobar-personaje']).toEqual(['admin', 'narrator']);
  });
});
