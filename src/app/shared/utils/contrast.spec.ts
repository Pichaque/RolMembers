import { THEME_PRESETS } from '../../core/models/theme-presets';
import { contrasteDeTema, contrastRatio, contrastText, temaAccesible } from './contrast';

describe('contraste', () => {
  it('calcula blanco sobre negro por encima de 4.5', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(4.5);
    expect(contrastText('#000000')).toBe('#ffffff');
    expect(contrastText('#ffffff')).toBe('#000000');
  });

  it('acepta los 12 presets en claro y en oscuro', () => {
    expect(THEME_PRESETS).toHaveLength(12);
    for (const preset of THEME_PRESETS) {
      const claro = contrasteDeTema(preset, 'light');
      const oscuro = contrasteDeTema(preset, 'dark');
      expect(claro.texto, preset.preset ?? '').toBeGreaterThanOrEqual(4.5);
      expect(oscuro.texto, preset.preset ?? '').toBeGreaterThanOrEqual(4.5);
      expect(claro.componente, preset.preset ?? '').toBeGreaterThanOrEqual(3);
      expect(oscuro.componente, preset.preset ?? '').toBeGreaterThanOrEqual(3);
      expect(temaAccesible(preset)).toBe(true);
    }
  });

  it('ajusta el texto de página en degradados claros', () => {
    const gradient = THEME_PRESETS.find((preset) => preset.backgroundStyle === 'gradient');
    expect(gradient).toBeTruthy();
    if (gradient) {
      expect(contrasteDeTema(gradient, 'light').texto).toBeGreaterThanOrEqual(4.5);
      expect(contrasteDeTema(gradient, 'dark').texto).toBeGreaterThanOrEqual(4.5);
    }
  });
});
