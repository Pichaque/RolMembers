import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { IonButton } from '@ionic/angular';
import { TablaDatosComponent } from './tabla-datos.component';

/** Una serie numérica del gráfico. */
export interface SerieGrafico {
  nombre: string;
  valores: number[];
}

/**
 * Gráfico de Chart.js con alternativa en tabla.
 * Los datos llegan por input; no consulta Supabase.
 */
@Component({
  selector: 'app-grafico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, TablaDatosComponent],
  templateUrl: './grafico.component.html',
  styleUrl: './grafico.component.scss',
})
/** Gráfico de Chart.js con alternativa en tabla. */
export class GraficoComponent {
  readonly titulo = input.required<string>();
  readonly etiquetas = input.required<string[]>();
  readonly series = input.required<SerieGrafico[]>();
  readonly tipo = input<'bar' | 'pie'>('bar');
  readonly tabla = signal(false);

  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');
  private chart: Chart | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
    effect(() => {
      const mostrarTabla = this.tabla();
      const etiquetas = this.etiquetas();
      const series = this.series();
      const tipo = this.tipo();
      const canvas = this.lienzo()?.nativeElement;
      this.chart?.destroy();
      this.chart = null;
      if (mostrarTabla || !canvas) {
        return;
      }
      const palette = leerColoresComunidad();
      const datasets = series.map((serie, index) => ({
        label: serie.nombre,
        data: serie.valores,
        backgroundColor: palette.series[index % palette.series.length],
        borderColor: palette.series[index % palette.series.length],
        maxBarThickness: 48,
        categoryPercentage: 0.55,
        barPercentage: 0.7,
      }));
      const options: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: palette.texto },
          },
        },
        scales: tipo === 'bar'
          ? {
              x: {
                ticks: { color: palette.texto },
                grid: { color: palette.rejilla },
              },
              y: {
                ticks: { color: palette.texto },
                grid: { color: palette.rejilla },
              },
            }
          : undefined,
      };
      this.chart = new Chart(canvas, {
        type: tipo,
        data: { labels: etiquetas, datasets },
        options,
      });
    });
  }

  descripcion(): string {
    const detalle = this.etiquetas().map((etiqueta, index) => {
      const valor = this.series()[0]?.valores[index] ?? 0;
      return `${etiqueta}: ${valor}`;
    }).join(', ');
    return `${this.titulo()}. ${detalle || 'Sin datos'}`;
  }

  columnas() {
    return [{ titulo: 'Serie' }, ...this.etiquetas().map((titulo) => ({ titulo }))];
  }

  filas() {
    return this.series().map((serie, index) => ({
      id: `${index}`,
      celdas: [serie.nombre, ...serie.valores.map((valor) => String(valor))],
    }));
  }
}

function leerColoresComunidad(): { primario: string; secundario: string; acento: string; texto: string; rejilla: string; series: string[] } {
  const root = globalThis.getComputedStyle(document.documentElement);
  const primario = root.getPropertyValue('--community-primary').trim() || '#b97650';
  const secundario = root.getPropertyValue('--community-secondary').trim() || '#d19367';
  const acento = root.getPropertyValue('--community-accent').trim() || '#f0d2b4';
  const texto = root.getPropertyValue('--color-on-panel').trim() || '#f4f1ea';
  const rejilla = root.getPropertyValue('--color-border').trim() || 'rgba(255,255,255,.2)';
  return { primario, secundario, acento, texto, rejilla, series: [primario, secundario, acento] };
}
