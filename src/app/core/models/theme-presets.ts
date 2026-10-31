import { Json, ThemePalette } from './database.types';

/** Doce paletas que pasan contraste en claro y en oscuro. */
export const THEME_PRESETS: ThemePalette[] = [
  { preset: 'Oro', primary: '#a86820', secondary: '#d7a15a', accent: '#f3ddb0', background: '#14110e', surface: '#f4efe6', backgroundStyle: 'tint' },
  { preset: 'Bosque', primary: '#008848', secondary: '#6dca96', accent: '#d7f3e4', background: '#101612', surface: '#f4efe6', backgroundStyle: 'tint' },
  { preset: 'Real', primary: '#0070d0', secondary: '#8eb6ea', accent: '#d5e6ff', background: '#10131c', surface: '#f4efe6', backgroundStyle: 'gradient' },
  { preset: 'Vino', primary: '#b03058', secondary: '#e08aa0', accent: '#f8d5de', background: '#1a1014', surface: '#f4efe6', backgroundStyle: 'solid' },
  { preset: 'Mar', primary: '#0080a0', secondary: '#79c3d4', accent: '#d5f3f8', background: '#0e161a', surface: '#f4efe6', backgroundStyle: 'gradient' },
  { preset: 'Pergamino', primary: '#8e541c', secondary: '#c4a574', accent: '#f6e7c1', background: '#f6efe4', surface: '#f4efe6', backgroundStyle: 'solid' },
  { preset: 'Violeta arcano', primary: '#6c4ccc', secondary: '#b7a4ea', accent: '#e4dcff', background: '#14121c', surface: '#f4efe6', backgroundStyle: 'tint' },
  { preset: 'Esmeralda', primary: '#008858', secondary: '#6dca9a', accent: '#d4f5e4', background: '#101614', surface: '#f4efe6', backgroundStyle: 'solid' },
  { preset: 'Atardecer', primary: '#c06010', secondary: '#e0a060', accent: '#ffe0c0', background: '#1a120e', surface: '#f4efe6', backgroundStyle: 'gradient' },
  { preset: 'Hielo', primary: '#2080b0', secondary: '#8ec4e0', accent: '#d8f2fa', background: '#10161a', surface: '#f4efe6', backgroundStyle: 'tint' },
  { preset: 'Carmesí', primary: '#bc244c', secondary: '#e08098', accent: '#f8d0da', background: '#1a1012', surface: '#f4efe6', backgroundStyle: 'solid' },
  { preset: 'Grafito', primary: '#5c6474', secondary: '#a8b0bc', accent: '#e4e8ee', background: '#141618', surface: '#f4efe6', backgroundStyle: 'solid' },
];

/** Rellena un tema incompleto con el preset Oro. */
export function normalizeTheme(theme: ThemePalette | null | undefined): ThemePalette {
  const fallback = THEME_PRESETS[0];
  return {
    preset: theme?.preset || fallback.preset,
    primary: hex(theme?.primary, fallback.primary ?? '#a86820'),
    secondary: hex(theme?.secondary, fallback.secondary ?? '#d7a15a'),
    accent: hex(theme?.accent, fallback.accent ?? '#f3ddb0'),
    background: hex(theme?.background, fallback.background ?? '#14110e'),
    surface: hex(theme?.surface, fallback.surface ?? '#f4efe6'),
    backgroundStyle: theme?.backgroundStyle === 'solid' || theme?.backgroundStyle === 'gradient' || theme?.backgroundStyle === 'tint'
      ? theme.backgroundStyle
      : 'tint',
  };
}

/** Serializa el tema al jsonb que valida la base. */
export function themeToJson(theme: ThemePalette): Json {
  const normalized = normalizeTheme(theme);
  return {
    preset: normalized.preset ?? 'Oro',
    primary: normalized.primary ?? '#a86820',
    secondary: normalized.secondary ?? '#d7a15a',
    accent: normalized.accent ?? '#f3ddb0',
    background: normalized.background ?? '#14110e',
    surface: normalized.surface ?? '#f4efe6',
    backgroundStyle: normalized.backgroundStyle ?? 'tint',
  };
}

function hex(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return fallback.toLowerCase();
  }
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }
  return value.toLowerCase();
}
