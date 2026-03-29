import { OcrProcessResult } from '../../shared-types';
import Tesseract from 'tesseract.js';

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
       
       // Evaluated strictly at runtime inside the function so Next.js Compiler ignores it
       const pdfExtractor = require('pdf-parse');
       const pdfAction = typeof pdfExtractor === 'function' ? pdfExtractor : (pdfExtractor.default || pdfExtractor);
       
       const pdfData = await pdfAction(buffer);
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

    // Total Amount (Look for matching $XX.XX or fully comma-separated decimal figures like 1,450.50)
    // We aggressively demand a `.XX` decimal tail to prevent random Invoice Integers from overpowering the Highest Number mathematical sweep.
    const amountRegex = /[\d,]+\.\d{2}/g;
    let maxAmount = 0;
    
    // Iterate all text lines: The highest decimal figure on a receipt is mathematically almost always the 'Total' or 'Grand Total'
    lines.forEach(line => {
       const matches = line.match(amountRegex);
       if (matches) {
          matches.forEach(m => {
             // Strip commas violently so '1,500.50' transforms into pure '1500.50' for Node engine
             const cleanNumber = m.replace(/,/g, '');
             const val = parseFloat(cleanNumber);
             if (!isNaN(val) && val > maxAmount) {
                maxAmount = val;
             }
          });
       }
    });

    // Date (Native JavaScript Date constructor crashes heavily on European/Indian DD-MM-YYYY formulas.)
    // We will slice out the distinct numbers globally and stitch them back into safe ISO strings manually.
    const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    let expense_date = new Date().toISOString().split('T')[0]; // Safe fallback to today
    
    for (const line of lines) {
       const datesFound = [...line.matchAll(dateRegex)];
       if (datesFound.length > 0) {
          const [_, p1, p2, p3] = datesFound[0];
          
          let day, month, year;
          year = p3.length === 2 ? '20' + p3 : p3; // Expand '26' to '2026' intelligently
          
          if (parseInt(p1) > 12) {
             // Example: 29-03-2026 mathematically dictates p1 MUST be the Day
             day = p1; month = p2;
          } else if (parseInt(p2) > 12) {
             // Example: 03-29-2026 mathematically dictates p2 MUST be the Day (American formula)
             month = p1; day = p2;
          } else {
             // Fallback baseline: User actively requested DD-MM-YYYY format layout prioritizing day first
             day = p1; month = p2;
          }
          
          // Re-assemble into a perfect ISO 8601 compliant YYYY-MM-DD block mapped strictly for the Supabase DB Date column.
          expense_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          break; // Snap the absolute first date mathematically printed near the top of the invoice header.
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
