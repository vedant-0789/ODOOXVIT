import { NextResponse } from 'next/server';
import { processReceiptImage } from '../../../../src/services/ocrService';
import { OcrProcessRequest } from '../../../../shared-types';

export async function POST(req: Request) {
  try {
    const body: OcrProcessRequest = await req.json();

    if (!body.image_url) {
      return NextResponse.json({ error: 'Missing image_url' }, { status: 400 });
    }

    // Call our stateless logic
    // We strictly follow the request to just return raw text so the user can verify before pushing to DB
    const ocrResult = await processReceiptImage({ image_url: body.image_url });

    return NextResponse.json({ data: ocrResult }, { status: 200 });
  } catch (error: any) {
    console.error("OCR API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
