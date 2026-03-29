import { NextResponse } from 'next/server';
import { processReceiptImage } from '../../../../src/services/ocrService';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing physical file upload payload. Expected multipart form-data.' }, { status: 400 });
    }

    // Call our stateless logic directly with the binary system packet
    // We strictly follow the request to just return raw JSON text
    const ocrResult = await processReceiptImage(file);

    return NextResponse.json({ data: ocrResult }, { status: 200 });
  } catch (error: any) {
    console.error("OCR API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
