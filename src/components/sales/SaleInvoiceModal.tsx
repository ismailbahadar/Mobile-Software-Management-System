import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Share2, Download, FileText, Check, Phone, MapPin } from 'lucide-react';
import { SaleInvoice } from '../../types';
import { storage } from '../../db/storage';
import { WhatsAppService } from '../../services/whatsappService';
import { BarcodeService } from '../../services/barcodeService';
import { useToast } from '../common/Toast';

interface SaleInvoiceModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleInvoiceModal: React.FC<SaleInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const settings = storage.getSettings();
  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm' | 'A4'>('80mm');
  const [waSent, setWaSent] = useState(false);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (invoice && barcodeCanvasRef.current) {
      BarcodeService.renderBarcodeToCanvas(
        barcodeCanvasRef.current,
        invoice.invoiceNo,
        'CODE128',
        { width: 1.5, height: 40, displayValue: true }
      );
    }
    setWaSent(false);
  }, [invoice, isOpen, printFormat]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppSend = () => {
    const message = WhatsAppService.getInvoiceMessage(invoice);
    const result = WhatsAppService.sendMessage(
      invoice.customerPhone,
      invoice.customerName,
      'Invoice',
      message,
      invoice.invoiceNo
    );
    setWaSent(true);
    showToast(`Invoice sent via WhatsApp to ${invoice.customerPhone}!`, 'success');

    // Also open web link in a new tab if user wants
    if (window.confirm('WhatsApp message recorded. Do you also want to open WhatsApp Web / App directly?')) {
      window.open(result.waLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format:</span>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  printFormat === '80mm'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal 80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  printFormat === '58mm'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal 58mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  printFormat === 'A4'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Standard A4
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppSend}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                waSent
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{waSent ? 'Sent on WhatsApp' : 'WhatsApp Invoice'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-950 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Preview Container (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 flex justify-center">
          <div
            id="printable-area"
            className={`bg-white text-black rounded-lg shadow-xl p-6 transition-all ${
              printFormat === '80mm'
                ? 'receipt-80mm w-[320px] text-xs'
                : printFormat === '58mm'
                ? 'receipt-58mm w-[240px] text-[11px]'
                : 'invoice-a4 w-full max-w-2xl text-sm'
            }`}
          >
            {/* Header */}
            <div className="text-center border-b pb-3 mb-3 border-gray-300">
              <h1 className="font-extrabold text-base tracking-tight uppercase">
                {settings.businessName}
              </h1>
              <p className="text-[11px] font-medium text-gray-700 mt-0.5 whitespace-pre-line">
                {settings.printer.shopSubHeader || settings.address}
              </p>
              <div className="flex items-center justify-center gap-3 text-[11px] text-gray-600 mt-1">
                <span>Tel: {settings.phone}</span>
                <span>•</span>
                <span>WhatsApp: {settings.whatsappPhone}</span>
              </div>
              {settings.ntnStrn && (
                <p className="text-[10px] text-gray-500 mt-0.5">{settings.ntnStrn}</p>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-1 text-[11px] mb-3 pb-2 border-b border-gray-200">
              <div>
                <span className="font-bold">Invoice #: </span>
                <span className="font-mono">{invoice.invoiceNo}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">Date: </span>
                <span>{invoice.date} {invoice.time}</span>
              </div>
              <div>
                <span className="font-bold">Customer: </span>
                <span>{invoice.customerName}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">Phone: </span>
                <span>{invoice.customerPhone}</span>
              </div>
              <div>
                <span className="font-bold">Sale Type: </span>
                <span className="uppercase font-semibold">{invoice.saleType}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">Salesman: </span>
                <span>{invoice.salesmanName}</span>
              </div>
            </div>

            {/* Item Table */}
            <table className="w-full text-left mb-3 text-[11px]">
              <thead>
                <tr className="border-b border-gray-400 font-bold">
                  <th className="py-1">Description</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1.5 pr-2">
                      <div className="font-bold text-gray-900">{it.itemName}</div>
                      {it.imei1 && (
                        <div className="text-[10px] text-gray-600 font-mono">
                          IMEI: {it.imei1}
                          {it.imei2 ? ` / ${it.imei2}` : ''}
                        </div>
                      )}
                      {it.color && <div className="text-[10px] text-gray-500">Color: {it.color}</div>}
                    </td>
                    <td className="py-1.5 text-center">{it.quantity}</td>
                    <td className="py-1.5 text-right font-mono">₨ {it.unitPrice.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-bold font-mono">₨ {it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Totals */}
            <div className="border-t border-gray-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">₨ {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span className="font-mono">- ₨ {invoice.discount.toLocaleString()}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Tax:</span>
                  <span className="font-mono">+ ₨ {invoice.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t border-b border-gray-400 py-1.5 mt-1">
                <span>Grand Total:</span>
                <span className="font-mono">₨ {invoice.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold">
                <span>Paid ({invoice.paymentMethod}):</span>
                <span className="font-mono text-emerald-700">₨ {invoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Remaining Balance:</span>
                <span className="font-mono text-rose-700">₨ {invoice.remainingAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Barcode & Footer notes */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-300 text-center">
              <div className="flex justify-center mb-1">
                <canvas ref={barcodeCanvasRef} className="max-h-12" />
              </div>
              <p className="text-[10px] text-gray-600 whitespace-pre-line leading-tight mt-1">
                {settings.printer.footerNotes}
              </p>
              <p className="text-[9px] text-gray-400 mt-2 font-mono">
                Software: Apex Mobile POS & Installment Management
              </p>
            </div>

            {/* Empty Feed Lines after Invoice End so Paper Cutter Does Not Cut Invoice Text */}
            <div className="invoice-feed-lines mt-2 pt-2 text-center select-none">
              {Array.from({ length: settings.printer?.bottomFeedLines ?? 5 }).map((_, idx) => (
                <div key={idx} className="h-4 leading-none text-transparent select-none pointer-events-none">
                  &nbsp;
                </div>
              ))}
              <div className="border-t border-dashed border-gray-300 my-1 opacity-50 text-[9px] font-mono tracking-widest text-gray-400">
                - - - - - - - - - - - - - - - - - - - - - - - -
              </div>
              <div className="h-3 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
