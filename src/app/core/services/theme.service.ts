import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { ThemePalette } from '../models/database.types';
import { normalizeTheme } from '../models/theme-presets';
import { accessibleMutedText, accessiblePageText } from '../../shared/utils/contrast';

export type ColorScheme = 'dark' | 'light';
export type SchemePreference = 'light' | 'dark' | 'system';

const DEFAULT_PRIMARY = '#b97650';
const DEFAULT_SECONDARY = '#d19367';
const BASE_BACKGROUND: RGB = [16, 25, 30];
const BASE_PANEL: RGB = [23, 35, 41];
const COLOR_PROPERTIES = [
  '--community-primary',
  '--community-secondary',
  '--community-glow',
  '--community-accent',
  '--community-surface',
  '--color-border',
  '--color-copper',
  '--color-text',
  '--color-muted',
  '--page-background',
  '--ion-background-color',
  '--ion-text-color',
  '--ion-color-primary',
  '--ion-color-primary-rgb',
  '--ion-color-primary-contrast',
  '--ion-color-primary-contrast-rgb',
  '--ion-color-primary-shade',
  '--ion-color-primary-tint',
] as const;

type RGB = [number, number, number];

@Injectable({ providedIn: 'root' })
/** Aplica el tema de la comunidad y el modo claro, oscuro o sistema. */
export class ThemeService {
  readonly preference = signal<SchemePreference>('system');
  readonly scheme = signal<ColorScheme>('dark');
  readonly textStep = signal(0);

  private readonly document = inject(DOCUMENT);

  constructor() {
    const saved = globalThis.localStorage?.getItem('color-scheme');
    const preference: SchemePreference = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    const step = Number(globalThis.localStorage?.getItem('text-step') ?? '0');
    this.textStep.set(step === -1 || step === 1 || step === 2 ? step : 0);
    this.applyText();
    this.applyPreference(preference);
    globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.preference() === 'system') {
        this.applyPreference('system');
      }
    });
  }

  /** Pasa de oscuro a claro, luego a sistema y vuelve a empezar. */
  cycleScheme(): void {
    const order: SchemePreference[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(this.preference()) + 1) % order.length] ?? 'system';
    this.applyPreference(next);
  }

  /** @param delta `-1` reduce el texto y `1` lo aumenta. */
  cambiarTexto(delta: number): void {
    this.textStep.set(Math.min(2, Math.max(-1, this.textStep() + delta)));
    this.applyText();
  }

  apply(theme: ThemePalette | null): void {
    const palette = normalizeTheme(theme);
    const primary = parseColor(palette.primary, DEFAULT_PRIMARY);
    const secondary = parseColor(palette.secondary, DEFAULT_SECONDARY);
    const accent = parseColor(palette.accent, '#f0d2b4');
    const background = parseColor(palette.background, toHex(BASE_BACKGROUND));
    const surface = parseColor(palette.surface, toHex(BASE_PANEL));
    const primaryRgb = toRgb(primary);
    const backgroundRgb = toRgb(background);
    const ink = palette.backgroundStyle === 'tint' ? mix(backgroundRgb, primaryRgb, 0.18) : backgroundRgb;
    const pageText = accessiblePageText(palette);
    const pageTextRgb = toRgb(pageText);
    const muted = toRgb(accessibleMutedText(palette, toHex(ink), pageText));
    const buttonText = contrastText(primaryRgb);
    const root = this.document.documentElement;
    const pageBackground = palette.backgroundStyle === 'gradient'
      ? `linear-gradient(160deg, ${toHex(ink)} 0%, ${secondary} 48%, ${primary} 100%)`
      : palette.backgroundStyle === 'solid'
        ? background
        : `radial-gradient(ellipse at 70% 0%, rgba(${primaryRgb.join(', ')}, .35), transparent 42%), ${toHex(ink)}`;

    root.style.setProperty('--community-primary', primary);
    root.style.setProperty('--community-secondary', secondary);
    root.style.setProperty('--community-accent', accent);
    root.style.setProperty('--community-surface', surface);
    root.style.setProperty('--community-glow', `rgba(${primaryRgb.join(', ')}, .22)`);
    root.style.setProperty('--color-border', `rgba(${primaryRgb.join(', ')}, .45)`);
    root.style.setProperty('--color-copper', primary);
    root.style.setProperty('--color-text', pageText);
    root.style.setProperty('--color-muted', toHex(muted));
    root.style.setProperty('--page-background', pageBackground);
    root.style.setProperty('--ion-background-color', toHex(ink));
    root.style.setProperty('--ion-text-color', pageText);
    root.style.setProperty('--ion-color-primary', primary);
    root.style.setProperty('--ion-color-primary-rgb', primaryRgb.join(', '));
    root.style.setProperty('--ion-color-primary-contrast', buttonText);
    root.style.setProperty('--ion-color-primary-contrast-rgb', toRgb(buttonText).join(', '));
    root.style.setProperty('--ion-color-primary-shade', toHex(mix(primaryRgb, [0, 0, 0], 0.12)));
    root.style.setProperty('--ion-color-primary-tint', toHex(mix(primaryRgb, [255, 255, 255], 0.12)));
  }

  private applyPreference(preference: SchemePreference): void {
    this.preference.set(preference);
    const systemDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    const scheme: ColorScheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
    this.scheme.set(scheme);
    this.document.documentElement.dataset['scheme'] = scheme;
    globalThis.localStorage?.setItem('color-scheme', preference);
  }

  private applyText(): void {
    const scale = 100 + this.textStep() * 12.5;
    this.document.documentElement.style.fontSize = `${scale}%`;
    globalThis.localStorage?.setItem('text-step', String(this.textStep()));
  }

  reset(): void {
    const root = this.document.documentElement;
    for (const property of COLOR_PROPERTIES) {
      root.style.removeProperty(property);
    }
  }
}

function parseColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return fallback;
  }

  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }

  return value.toLowerCase();
}

function toRgb(color: string): RGB {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(rgb: RGB): string {
  return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mix(first: RGB, second: RGB, amount: number): RGB {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
}

function luminance(rgb: RGB): number {
  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: RGB, second: RGB): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function contrastText(background: RGB): string {
  const white: RGB = [255, 255, 255];
  const black: RGB = [0, 0, 0];
  return contrastRatio(background, white) >= contrastRatio(background, black) ? '#ffffff' : '#000000';
}
