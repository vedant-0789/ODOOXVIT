import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const type = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (type === 'application/pdf') {
      try {
        // Polyfill DOMMatrix for PDF.js inside Next.js Node runtime
        if (typeof global.DOMMatrix === 'undefined') {
          (global as any).DOMMatrix = class DOMMatrix {};
        }
        if (typeof (globalThis as any).DOMMatrix === 'undefined') {
          (globalThis as any).DOMMatrix = class DOMMatrix {};
        }
        
        // Lazy-load to ensure polyfills execute first
        const pdfParseRaw = await import('pdf-parse');
        let pdfParseFunc = (pdfParseRaw as any).default || pdfParseRaw;
        if (typeof pdfParseFunc !== 'function' && pdfParseFunc.default) {
          pdfParseFunc = pdfParseFunc.default;
        }
        
        const pdfData = await pdfParseFunc(buffer);
        extractedText = pdfData.text;
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to parse PDF: ${err.message}` }, { status: 500 });
      }
    } else if (type.startsWith('image/')) {
      try {
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(buffer);
        extractedText = ret.data.text;
        await worker.terminate();
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to run OCR on image: ${err.message}` }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file format.' }, { status: 400 });
    }

    // Heuristics for data extraction
    let amount = "0.00";
    const totalRegexes = [
      /Total[\s\S]{0,20}?(?:Rs\.?|USD|\$|₹|INR|\p{Sc})?\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/iu,
      /Amount[\s\S]{0,20}?(?:Rs\.?|USD|\$|₹|INR|\p{Sc})?\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/iu,
      /(?:Rs\.?|USD|\$|₹|INR|\p{Sc})\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/iu,
    ];
    
    for (const regex of totalRegexes) {
      const match = extractedText.match(regex);
      if (match && match[1]) {
        amount = match[1].replace(/,/g, '');
        break; 
      }
    }

    if (amount === "0.00") {
      const decimals = [...extractedText.matchAll(/\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g)];
      if (decimals.length > 0) {
        let max = 0;
        decimals.forEach(d => {
          const val = parseFloat(d[0].replace(/,/g, ''));
          if (val > max) max = val;
        });
        if (max > 0) amount = max.toFixed(2);
      }
    }

    let date = new Date().toISOString().split('T')[0];
    const dateRegexes = [
      /\b(\d{4}[-/]\d{2}[-/]\d{2})\b/, 
      /\b(\d{2}[-/]\d{2}[-/]\d{4})\b/, 
      /\b(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[A-Za-z]*\s\d{4})\b/i, 
    ];
    
    for (const regex of dateRegexes) {
      const match = extractedText.match(regex);
      if (match && match[1]) {
        try {
          const parsedData = new Date(match[1]);
          if (!isNaN(parsedData.getTime())) {
            date = parsedData.toISOString().split('T')[0];
            break;
          }
        } catch (e) {}
      }
    }

    const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let merchant = lines.length > 0 ? lines[0] : 'Unknown Merchant';
    if (/^[\W\d]+$/.test(merchant) && lines.length > 1) {
      merchant = lines[1];
    }

    return NextResponse.json({
      amount,
      date,
      merchant,
      rawText: extractedText
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
