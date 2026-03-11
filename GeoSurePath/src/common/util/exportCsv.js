import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const exportCsv = (title, fileName, sheets) => {
  if (sheets.size === 0) {
    return;
  }

  let fullCsv = '';
  sheets.forEach((rows, sheetTitle) => {
    fullCsv += `"${title} - ${sheetTitle}"\n`;
    fullCsv += Papa.unparse(rows);
    fullCsv += '\n\n';
  });

  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, fileName);
};

export default exportCsv;
