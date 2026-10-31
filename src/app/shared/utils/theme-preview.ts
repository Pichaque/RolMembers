import { ThemePalette } from '../../core/models/database.types';
import { normalizeTheme } from '../../core/models/theme-presets';
import { accessiblePageText, contrastText } from './contrast';

/** Estilos inline para la miniatura de tema del editor. */
export interface ThemePreviewStyles {
  page: Record<string, string>;
  card: Record<string, string>;
  title: Record<string, string>;
  line: Record<string, string>;
  button: Record<string, string>;
}

const DEFAULT_PRIMARY = '#b97650';
const DEFAULT_SECONDARY = '#d19367';
const BASE_BACKGROUND = '#10191e';
const BASE_PANEL = '#172329';

/** Calcula fondos y textos accesibles igual que al aplicar el tema en la app. */
export function buildThemePreview(theme: ThemePalette): ThemePreviewStyles {
  const palette = normalizeTheme(theme);
  const primary = hex(palette.primary, DEFAULT_PRIMARY);
  const secondary = hex(palette.secondary, DEFAULT_SECONDARY);
  const background = hex(palette.background, BASE_BACKGROUND);
  const surface = hex(palette.surface, BASE_PANEL);
  const primaryRgb = toRgb(primary);
  const backgroundRgb = toRgb(background);
  const ink = palette.backgroundStyle === 'tint' ? mixHex(background, primary, 0.18) : background;
  const pageText = accessiblePageText(palette);
  const onSurface = contrastText(surface);
  const onPrimary = contrastText(primary);

  const pageBackground =
    palette.backgroundStyle === 'gradient'
      ? `linear-gradient(160deg, ${ink} 0%, ${secondary} 48%, ${primary} 100%)`
      : palette.backgroundStyle === 'solid'
        ? background
        : `radial-gradient(ellipse at 70% 0%, rgba(${primaryRgb.join(', ')}, .35), transparent 42%), ${ink}`;

  return {
    page: {
      background: pageBackground,
      color: pageText,
      border: `1px solid rgba(${primaryRgb.join(', ')}, .35)`,
    },
    card: {
      background: surface,
      color: onSurface,
      border: `1px solid rgba(${primaryRgb.join(', ')}, .35)`,
    },
    title: { color: onSurface },
    line: { color: onSurface, opacity: '0.82' },
    button: {
      background: primary,
      color: onPrimary,
      border: 'none',
    },
  };
}

function hex(value: string | null | undefined, fallback: string): string {
  if (typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
      : value.toLowerCase();
  }
  return fallback;
}

function toRgb(color: string): [number, number, number] {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixHex(first: string, second: string, amount: number): string {
  const a = toRgb(first);
  const b = toRgb(second);
  const mixed = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
