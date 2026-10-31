import { sanitizeCsv } from './csv';

describe('sanitizeCsv', () => {
  it('antepone un apóstrofo a las fórmulas y deja el resto igual', () => {
    expect(sanitizeCsv('=1+1')).toBe("'=1+1");
    expect(sanitizeCsv('+1')).toBe("'+1");
    expect(sanitizeCsv('-1')).toBe("'-1");
    expect(sanitizeCsv('@cmd')).toBe("'@cmd");
    expect(sanitizeCsv('Sesión')).toBe('Sesión');
  });
});
