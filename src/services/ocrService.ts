import { OcrProcessResult } from '../../shared-types';
import Tesseract from 'tesseract.js';
// @ts-ignore : Suppressing the loose typings of the offline pdf extractor package
import pdfParse from 'pdf-parse';

/**
 * Completely offline OCR/PDF evaluation using Dual Engines.
 * Takes a binary File chunk, translates it into a Buffer, and applies Regex math to extract receipt figures.
 */
export async function processReceiptImage(
  file: Blob | File
): Promise<OcrProcessResult> {
  try {
    // 1. Translate the frontend HTML5 File Blob into a native Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';

    // 2. Intelligent File Routing: Does it use Pixel Pixels or Digital Structure?
    if (file.type === 'application/pdf') {
       // Rip purely structural text instantly out of the PDF Buffer using PDF.js Core Logic
       console.log("📄 Running PDF structural parser...");
       const pdfData = await pdfParse(buffer);
       text = pdfData.text;
    } else {
       // Ignite the local offline CPU-bound Worker Thread for dirty pixel images
       console.log("📷 Running Tesseract WebAssembly engine...");
       const tesseractResult = await Tesseract.recognize(buffer, 'eng');
       text = tesseractResult.data.text;
    }

    // 3. RegEx Deep Extraction Engine (Receives both pipelines interchangeably!)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Merchant Name (Usually the very first legible line on a receipt)
    const merchant_name = lines.length > 0 ? lines[0] : 'Unknown Merchant';

    // Total Amount (Look for matching $XX.XX or raw decimal figures aggressively)
    const amountRegex = /\$?\d+\.\d{2}/g;
    let maxAmount = 0;
    
    // Iterate all text lines: The highest decimal figure on a receipt is mathematically always the 'Total'
    lines.forEach(line => {
       const matches = line.match(amountRegex);
       if (matches) {
          matches.forEach(m => {
             const val = parseFloat(m.replace('$', ''));
             if (!isNaN(val) && val > maxAmount) {
                maxAmount = val;
             }
          });
       }
    });

    // Date (Look for MM/DD/YYYY or similar standard American strings)
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
    let expense_date = new Date().toISOString().split('T')[0]; // Safe fallback to today
    
    for (const line of lines) {
       const match = line.match(dateRegex);
       if (match) {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed.getTime())) {
             expense_date = parsed.toISOString().split('T')[0];
             break;
          }
       }
    }

    // 4. Hydrate the original strict DTO cleanly for the React Frontend Developers
    return {
      total_amount: maxAmount > 0 ? maxAmount : 0,
      expense_date: expense_date,
      category: 'General Operations', // Dynamic NLP categorization is beyond pure regex
      merchant_name: merchant_name,
      description: `Offline Extract: ${merchant_name} via Tesseract.js`
    };

  } catch (error: any) {
    console.error("Tesseract Core Offline Error:", error.message);
    throw new Error(`Local OCR processing violently failed: ${error.message}`);
  }
}
