import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Datos que el PDF pinta. No lee de la base. */
export interface InformePdf {
  titulo: string;
  color: string;
  columnas: string[];
  filas: string[][];
}

/**
 * Genera un PDF con cabecera, filas alternas y pie de página.
 * @param informe Contenido ya preparado por la página.
 */
export function downloadPdf(informe: InformePdf): void {
  const doc = new jsPDF();
  const [red, green, blue] = rgb(informe.color);
  doc.setFillColor(red, green, blue);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(informe.titulo, 14, 12);
  doc.setTextColor(40, 32, 24);
  doc.setFontSize(10);
  doc.text(`Generado el ${new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, 14, 26);
  autoTable(doc, {
    head: [informe.columnas],
    body: informe.filas,
    startY: 32,
    headStyles: { fillColor: [red, green, blue] },
    alternateRowStyles: { fillColor: [245, 240, 232] },
  });
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(80, 70, 60);
    doc.text(`página ${page} de ${total}`, 14, 290);
  }
  doc.save(`${informe.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

function rgb(color: string): [number, number, number] {
  const clean = color.trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean;
  const value = Number.parseInt(full, 16);
  if (!/^[\da-f]{6}$/i.test(full) || Number.isNaN(value)) {
    return [185, 118, 80];
  }
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
