import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports report data as a PDF file.
 * @param {string} title - Report title
 * @param {string} fileName - Output filename (e.g. trips.pdf)
 * @param {Map} sheets - Map of sheetTitle => rowsArray
 */
const exportPdf = async (title, fileName, sheets) => {
  if (!sheets || sheets.size === 0) return;

  const doc = new jsPDF('l', 'mm', 'a4');
  let first = true;

  sheets.forEach((rows, sheetTitle) => {
    if (!first) {
      doc.addPage();
    }
    first = false;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${title}`, 14, 14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Section: ${sheetTitle}`, 14, 22);
    doc.setTextColor(0, 0, 0);

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      // Strip React elements
      if (typeof val === 'object' && val.props) return '';
      return String(val);
    }));

    doc.autoTable({
      head: [headers],
      body,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
    });
  });

  doc.save(fileName);
};

export default exportPdf;
