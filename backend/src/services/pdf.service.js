import { generatePDF } from '../../../src/engines/pdfGenerator.js';

class PdfService {
  generate(results, formData) {
    const { doc, filename } = generatePDF(results, formData);
    const buffer = doc.output('arraybuffer');
    return { buffer, filename };
  }
}

export default new PdfService();
