import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface PrintDocumentProps {
  title: string;
  documentNumber: string;
  date: string;
  vendor?: {
    name: string;
    address: string;
    gstin: string;
  };
  companyName: string;
  items: Array<{
    skuId: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    total?: number;
    received?: number;
    accepted?: number;
    rejected?: number;
  }>;
  totalAmount?: number;
  onClose: () => void;
  status?: string;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  title,
  documentNumber,
  date,
  vendor,
  companyName,
  items,
  totalAmount,
  onClose,
  status
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col overflow-hidden animate-in fade-in duration-300 backdrop-blur-sm">
      {/* Header / Controls */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Document Preview</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-primary-600 transition-colors shadow-sm">
            <Download size={16} />
            Download PDF
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
          >
            <Printer size={16} />
            Print Document
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:p-0">
        <div className="max-w-[800px] mx-auto bg-white shadow-2xl p-12 text-slate-900 print:shadow-none print:max-w-full">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{companyName}</h1>
              <p className="text-xs font-mono uppercase text-slate-500 tracking-widest">Industrial Procurement Division</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</h2>
              <p className="text-sm font-mono font-bold text-slate-900">{documentNumber}</p>
              {status && (
                <div className="mt-2 inline-block px-3 py-1 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest">
                  Status: {status}
                </div>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-[10px] font-mono uppercase text-slate-400 mb-3 border-b border-slate-200 pb-1">Vendor Details</h3>
              {vendor ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold">{vendor.name}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{vendor.address}</p>
                  <p className="text-[10px] font-mono mt-2">GSTIN: {vendor.gstin}</p>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">Internal Document</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-[10px] font-mono uppercase text-slate-400 mb-3 border-b border-slate-200 pb-1 text-right">Document Info</h3>
              <div className="space-y-1">
                <p className="text-xs"><span className="text-slate-400 uppercase font-mono mr-2">Date:</span> {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs"><span className="text-slate-400 uppercase font-mono mr-2">Currency:</span> INR (₹)</p>
                <p className="text-xs"><span className="text-slate-400 uppercase font-mono mr-2">Terms:</span> Net 30 Days</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-3 text-left text-[10px] font-mono uppercase tracking-widest">Item / SKU</th>
                <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Qty</th>
                {items[0].unitPrice !== undefined && (
                  <>
                    <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Rate</th>
                    <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Total</th>
                  </>
                )}
                {items[0].received !== undefined && (
                  <>
                    <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Recv</th>
                    <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Accp</th>
                    <th className="py-3 text-right text-[10px] font-mono uppercase tracking-widest">Rej</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <p className="text-sm font-bold">{item.name || item.skuId}</p>
                    <p className="text-[10px] font-mono text-slate-400">{item.skuId}</p>
                  </td>
                  <td className="py-4 text-right text-sm font-mono">{item.quantity}</td>
                  {item.unitPrice !== undefined && (
                    <>
                      <td className="py-4 text-right text-sm font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 text-right text-sm font-bold font-mono">{formatCurrency(item.total || 0)}</td>
                    </>
                  )}
                  {item.received !== undefined && (
                    <>
                      <td className="py-4 text-right text-sm font-mono text-blue-600">{item.received}</td>
                      <td className="py-4 text-right text-sm font-mono text-green-600">{item.accepted}</td>
                      <td className="py-4 text-right text-sm font-mono text-red-600">{item.rejected}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          {totalAmount !== undefined && (
            <div className="flex justify-end mb-12">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-xs text-slate-500 uppercase font-mono">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 uppercase font-mono">
                  <span>Tax (GST 18%)</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-lg font-black italic uppercase">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="grid grid-cols-2 gap-12 mt-24">
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-[10px] font-mono uppercase text-slate-400 mb-8">Authorized Signatory</h4>
              <div className="h-12 border-b border-slate-900 w-48 mb-2"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Procurement Manager</p>
            </div>
            <div className="border-t border-slate-200 pt-4 text-right">
              <h4 className="text-[10px] font-mono uppercase text-slate-400 mb-8">Receiver's Signature</h4>
              <div className="h-12 border-b border-slate-900 w-48 ml-auto mb-2"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Date & Stamp</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
              This is a computer generated document. No physical signature is required for digital verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
