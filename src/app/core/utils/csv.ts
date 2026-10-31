/**
 * Descarga un CSV con separador `;`, BOM UTF-8 y celdas saneadas.
 * @param filename Nombre del archivo.
 * @param headers Cabeceras.
 * @param rows Filas de texto.
 */
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (value: string): string => `"${sanitizeCsv(value).replaceAll('"', '""')}"`;
  const content = [headers, ...rows].map((row) => row.map((value) => escape(value)).join(';')).join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Evita que una hoja de cálculo ejecute la celda como fórmula.
 * @param value Texto original.
 * @returns El mismo texto, o con un apóstrofo delante si empieza por `=`, `+`, `-` o `@`.
 */
export function sanitizeCsv(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
