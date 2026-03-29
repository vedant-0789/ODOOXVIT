'use client';

import { useState } from 'react';

export default function TestAPIPage() {
  // 1. OCR State
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  // 2. Currency State
  const [convExpenseId, setConvExpenseId] = useState('');
  const [convTargetCur, setConvTargetCur] = useState('INR');
  const [convResult, setConvResult] = useState('');
  const [convLoading, setConvLoading] = useState(false);

  // 3. Workflow State
  const [wfExpenseId, setWfExpenseId] = useState('');
  const [wfApproverId, setWfApproverId] = useState('');
  const [wfAction, setWfAction] = useState('APPROVE');
  const [wfResult, setWfResult] = useState('');
  const [wfLoading, setWfLoading] = useState(false);

  const testOCR = async () => {
    if (!ocrFile) return setOcrResult('Please select a physical file first.');
    setOcrLoading(true);
    setOcrResult('Loading...');
    try {
      const fd = new FormData();
      fd.append('file', ocrFile);

      const res = await fetch('/api/expense/ocr', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      setOcrResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setOcrResult(e.message || 'Error occurred');
    } finally {
      setOcrLoading(false);
    }
  };

  const testCurrency = async () => {
    setConvLoading(true);
    setConvResult('Loading...');
    try {
      const res = await fetch('/api/expense/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense_id: convExpenseId, target_currency: convTargetCur })
      });
      const data = await res.json();
      setConvResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setConvResult(e.message || 'Error occurred');
    } finally {
      setConvLoading(false);
    }
  };

  const testWorkflow = async () => {
    setWfLoading(true);
    setWfResult('Loading...');
    try {
      const res = await fetch('/api/workflows/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense_id: wfExpenseId, approver_id: wfApproverId, action: wfAction })
      });
      const data = await res.json();
      setWfResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setWfResult(e.message || 'Error occurred');
    } finally {
      setWfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-800">Backend API Testing Dashboard</h1>
          <p className="text-slate-500 mt-2">Hackathon Member 2 Integration Testing Harness</p>
        </div>

        {/* --- 1. OCR CARD --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">1. OCR Image Parser</h2>
          <div className="flex flex-col gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt (PDF/Image):</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
             </div>
             <button 
                onClick={testOCR}
                disabled={ocrLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
             >
                {ocrLoading ? 'Parsing...' : 'Test OCR Engine'}
             </button>
             
             {ocrResult && (
               <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
                 {ocrResult}
               </pre>
             )}
          </div>
        </section>

        {/* --- 2. CURRENCY CARD --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">2. Real-Time Currency Converter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Expense ID (UUID):</label>
                <input 
                  type="text" 
                  placeholder="e.g. b8c30-..."
                  value={convExpenseId}
                  onChange={(e) => setConvExpenseId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Currency:</label>
                <input 
                  type="text" 
                  placeholder="INR"
                  value={convTargetCur}
                  onChange={(e) => setConvTargetCur(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
             </div>
          </div>
          
          <button 
             onClick={testCurrency}
             disabled={convLoading || !convExpenseId}
             className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
          >
             {convLoading ? 'Converting...' : 'Test Exchange Rate API'}
          </button>
          
          {convResult && (
             <div className="mt-4">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
                   {convResult}
                </pre>
             </div>
          )}
        </section>

        {/* --- 3. WORKFLOW CARD --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">3. Workflow Engine Evaluator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense ID (UUID):</label>
                <input 
                  type="text" 
                  value={wfExpenseId}
                  onChange={(e) => setWfExpenseId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approver ID (UUID):</label>
                <input 
                  type="text" 
                  value={wfApproverId}
                  onChange={(e) => setWfApproverId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Action:</label>
                <select 
                  value={wfAction}
                  onChange={(e) => setWfAction(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                >
                  <option value="APPROVE">Approve</option>
                  <option value="REJECT">Reject</option>
                </select>
             </div>
          </div>

          <button 
             onClick={testWorkflow}
             disabled={wfLoading || !wfExpenseId || !wfApproverId}
             className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
          >
             {wfLoading ? 'Computing State...' : 'Fire Approval Event'}
          </button>

          {wfResult && (
             <div className="mt-4">
                <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
                   {wfResult}
                </pre>
             </div>
          )}
        </section>
        
      </div>
    </div>
  );
}
