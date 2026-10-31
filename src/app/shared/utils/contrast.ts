import { ThemePalette } from '../../core/models/database.types';

type RGB = [number, number, number];

/** Relación de contraste WCAG entre dos colores `#rrggbb`. */
export function contrastRatio(first: string, second: string): number {
  const values = [luminance(toRgb(first)), luminance(toRgb(second))].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

/** Relación de contraste entre dos colores RGB. */
export function contrastRatioRgb(first: RGB, second: RGB): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

/** Elige blanco o negro, el que contraste más con el fondo. */
export function contrastText(background: string): '#ffffff' | '#000000' {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000') ? '#ffffff' : '#000000';
}

/** Ajusta el primer plano hasta alcanzar al menos 4.5:1 sobre el fondo. */
export function ensureContrastRgb(foreground: RGB, background: RGB, minRatio = 4.5): RGB {
  if (contrastRatioRgb(foreground, background) >= minRatio) {
    return foreground;
  }
  for (let step = 1; step <= 20; step += 1) {
    const lighter = mixRgb(foreground, [255, 255, 255], step / 20);
    if (contrastRatioRgb(lighter, background) >= minRatio) {
      return lighter;
    }
  }
  for (let step = 1; step <= 20; step += 1) {
    const darker = mixRgb(foreground, [0, 0, 0], step / 20);
    if (contrastRatioRgb(darker, background) >= minRatio) {
      return darker;
    }
  }
  return foreground;
}

/** Color de página más claro que se pinta con el tema (para contraste del texto). */
export function lightestPageBackground(theme: ThemePalette): string {
  const primary = theme.primary ?? '#000000';
  const secondary = theme.secondary ?? '#000000';
  const background = theme.background ?? '#000000';
  const style = theme.backgroundStyle ?? 'tint';
  const ink = style === 'tint' ? mixHex(background, primary, 0.18) : background;
  if (style === 'gradient') {
    return [ink, secondary, primary].reduce((lightest, sample) =>
      luminance(toRgb(sample)) > luminance(toRgb(lightest)) ? sample : lightest,
    ink);
  }
  if (style === 'solid') {
    return background;
  }
  return ink;
}

/**
 * Contraste del tema en un modo.
 * El texto exige 4.5:1 y el botón, como componente, 3:1 con el panel.
 */
export function contrasteDeTema(theme: ThemePalette, modo: 'light' | 'dark'): { texto: number; componente: number } {
  const primary = theme.primary ?? '#000000';
  const surface = theme.surface ?? '#000000';
  const panel = modo === 'dark' ? '#101114' : mixHex(surface, '#fffdf8', 0.7);
  const textoPanel = modo === 'dark' ? '#f4f1ea' : '#241c16';
  const textoBoton = contrastText(primary);
  const fondoPagina = lightestPageBackground(theme);
  const textoPaginaBase = toRgb(contrastText(fondoPagina));
  const textoPaginaAjustado = ensureContrastRgb(textoPaginaBase, toRgb(fondoPagina));
  return {
    texto: Math.min(
      contrastRatio(textoPanel, panel),
      contrastRatio(textoBoton, primary),
      contrastRatioRgb(textoPaginaAjustado, toRgb(fondoPagina)),
    ),
    componente: contrastRatio(primary, panel),
  };
}

/** `true` si el tema cumple en claro y en oscuro. */
export function temaAccesible(theme: ThemePalette): boolean {
  return (['light', 'dark'] as const).every((modo) => {
    const contraste = contrasteDeTema(theme, modo);
    return contraste.texto >= 4.5 && contraste.componente >= 3;
  });
}

function toRgb(color: string): RGB {
  const value = Number.parseInt(color.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(rgb: RGB): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

function luminance(rgb: RGB): number {
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function mixHex(first: string, second: string, amount: number): string {
  return toHex(mixRgb(toRgb(first), toRgb(second), amount));
}

function mixRgb(first: RGB, second: RGB, amount: number): RGB {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
}

/** Texto de página accesible sobre el fondo real del tema. */
export function accessiblePageText(theme: ThemePalette): string {
  const fondo = lightestPageBackground(theme);
  const base = toRgb(contrastText(fondo));
  return toHex(ensureContrastRgb(base, toRgb(fondo)));
}

/** Texto atenuado accesible sobre el fondo real del tema. */
export function accessibleMutedText(theme: ThemePalette, inkHex: string, pageTextHex: string): string {
  const fondo = toRgb(lightestPageBackground(theme));
  const muted = mixRgb(toRgb(inkHex), toRgb(pageTextHex), 0.72);
  return toHex(ensureContrastRgb(muted, fondo));
}
