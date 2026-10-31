import { resumirInforme } from './informes';

describe('resumirInforme', () => {
  it('cuenta personajes, sesiones y asistencia de la comunidad filtrada', () => {
    const resumen = resumirInforme({
      servidores: [
        { id: 'a', name: 'Mesa A' },
        { id: 'b', name: 'Mesa B' },
      ],
      personajes: [
        { server_id: 'a', created_at: '2026-03-02T10:00:00.000Z' },
        { server_id: 'b', created_at: '2026-03-02T10:00:00.000Z' },
      ],
      eventos: [
        { id: 'e1', server_id: 'a', starts_at: '2026-03-10T18:00:00.000Z' },
        { id: 'e2', server_id: 'a', starts_at: '2026-01-10T18:00:00.000Z' },
      ],
      miembros: [
        { server_id: 'a', role: 'narrator' },
        { server_id: 'b', role: 'player' },
      ],
      asistencia: [
        { event_id: 'e1', server_id: 'a', status: 'yes' },
        { event_id: 'e2', server_id: 'a', status: 'yes' },
      ],
      administradores: 1,
      comunidad: 'a',
      desde: '2026-03-01',
      hasta: '2026-03-31',
    });

    expect(resumen.personajes).toBe(1);
    expect(resumen.sesiones).toBe(1);
    expect(resumen.roles).toEqual([1, 1, 0]);
    expect(resumen.asistenciaYes).toEqual([1]);
    expect(resumen.filas).toEqual([['Mesa A', '1', '1', '1']]);
  });
});
