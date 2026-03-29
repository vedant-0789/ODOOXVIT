import { OcrProcessResult } from '../../shared-types';

/**
 * Connects to the Mindee Expense Receipt API (v5) to parse receipts automatically via strict binary uploads.
 * Expects the environment variable MINDEE_API_KEY to be set during deployment.
 */
export async function processReceiptImage(
  file: Blob | File
): Promise<OcrProcessResult> {
  const apiKey = process.env.MINDEE_API_KEY;
  
  // Clean fallback mechanism to keep the rest of the Hackathon team unblocked
  if (!apiKey) {
    console.warn("⚠️ MINDEE_API_KEY is not set globally. Falling back to mock OCR data parsing.");
    return generateMockOcrResponse();
  }

  try {
    // 1. Take the physical Blob and package it into a rigid OS formData payload
    const formData = new FormData();
    // Providing a generic fallback filename ensures backend validation compatibility
    const filename = (file as any).name || 'receipt.pdf';
    formData.append('document', file, filename);

    // 2. Send the binary formData specifically to Mindee's v5 Engine
    const mindeeResponse = await fetch("https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`
      },
      body: formData
    });

    if (!mindeeResponse.ok) {
       throw new Error(`Mindee API Failure. Status: ${mindeeResponse.statusText}`);
    }

    const mindeeData = await mindeeResponse.json();
    const document = mindeeData.document.inference.prediction;

    // 3. Destructure Mindee's native response directly to our strict Application DTO
    return {
      total_amount: document.total_amount.value || 0,
      expense_date: document.date.value || new Date().toISOString().split('T')[0],
      category: document.category.value || 'General',
      merchant_name: document.supplier_name.value || 'Unknown Merchant',
      // Dynamically stitching a helpful description if the user didn't write one
      description: `Auto-Expense from ${document.supplier_name.value || 'Unknown Merchant'}` 
    };

  } catch (error: any) {
    console.error("OCRService Engine Error:", error.message);
    throw new Error(`OCR processing completely failed: ${error.message}`);
  }
}

/**
 * Private Mock payload allowing Dev 2 & 3 to test the UI/DB workflows even if the OCR API triggers limits
 */
function generateMockOcrResponse(): OcrProcessResult {
  return {
    total_amount: 145.50,
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Meals & Entertainment',
    merchant_name: 'Hackathon Pizza Place',
    description: 'Auto-Expense from Hackathon Pizza Place'
  };
}
