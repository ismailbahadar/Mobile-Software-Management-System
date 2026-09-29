import React, { useState } from 'react';
import { 
  X, Printer, Share2, Download, FileText, Smartphone, 
  CheckCircle2, ShieldCheck, Wrench, User, Calendar, QrCode 
} from 'lucide-react';
import { RepairJob } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface RepairInvoiceModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: 'standard' | 'thermal';
}

export const RepairInvoiceModal: React.FC<RepairInvoiceModalProps> = ({
  repair,
  isOpen,
  onClose,
  initialFormat = 'standard',
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;

  const [format, setFormat] = useState<'standard' | 'thermal'>(initialFormat);

  if (!isOpen || !repair) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    WhatsAppService.sendRepairWhatsApp(repair, repair.status === 'Delivered' ? 'delivered' : 'readyForCollection');
    showToast(`Invoice dispatched via WhatsApp to ${repair.customerName}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Controls Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Format:</span>
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setFormat('standard')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  format === 'standard' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 / Standard Invoice
              </button>
              <button
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  format === 'thermal' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Thermal Receipt
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-950"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center text-slate-900">
          
          {/* STANDARD A4 INVOICE */}
          {format === 'standard' && (
            <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 text-slate-800 text-xs space-y-5 print:shadow-none print:border-none print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {settings.businessName}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Professional Smartphone Repair & Service Center
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{settings.address}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Tel: {settings.phone} {settings.email && `| Email: ${settings.email}`}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-sm rounded">
                    {repair.repairNo}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Date: {repair.date} {repair.time}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 block uppercase">
                    Status: {repair.status}
                  </span>
                </div>
              </div>

              {/* Customer & Device Meta Cards */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">Customer Details:</span>
                  <div><strong className="text-slate-700">Name:</strong> {repair.customerName}</div>
                  <div><strong className="text-slate-700">Phone:</strong> {repair.customerPhone}</div>
                  {repair.customerCnic && <div><strong className="text-slate-700">CNIC:</strong> {repair.customerCnic}</div>}
                  {repair.customerAddress && <div><strong className="text-slate-700">Address:</strong> {repair.customerAddress}</div>}
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-xs block">Device Specifications:</span>
                  <div><strong className="text-slate-700">Device:</strong> {repair.brand} {repair.model}</div>
                  <div><strong className="text-slate-700">IMEI:</strong> <span className="font-mono">{repair.imei1 || 'N/A'}</span></div>
                  <div><strong className="text-slate-700">Color / Storage:</strong> {repair.color || 'Standard'} • {repair.storage || 'N/A'}</div>
                  <div><strong className="text-slate-700">Condition:</strong> {repair.physicalCondition}</div>
                </div>
              </div>

              {/* Technical Work & Diagnosis */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                <div>
                  <strong className="text-slate-800">Customer Complaint:</strong> {repair.customerComplaint}
                </div>
                <div>
                  <strong className="text-slate-800">Technician Diagnosis:</strong>{' '}
                  {repair.technicianDiagnosis || repair.faultFound || 'Complete technical inspection performed.'}
                </div>
                {repair.requiredRepair && (
                  <div>
                    <strong className="text-slate-800">Work Done:</strong> {repair.requiredRepair}
                  </div>
                )}
                {repair.assignedTechnicianName && (
                  <div>
                    <strong className="text-slate-800">Technician:</strong> {repair.assignedTechnicianName}
                  </div>
                )}
              </div>

              {/* Accessories Received Tag */}
              <div className="text-[10px] text-slate-600 flex flex-wrap gap-2">
                <strong className="text-slate-800">Accessories Submitted:</strong>
                {repair.accessories.charger && <span className="bg-slate-200 px-1.5 py-0.5 rounded">Charger</span>}
                {repair.accessories.cable && <span className="bg-slate-200 px-1.5 py-0.5 rounded">Cable</span>}
                {repair.accessories.box && <span className="bg-slate-200 px-1.5 py-0.5 rounded">Box</span>}
                {repair.accessories.sim && <span className="bg-slate-200 px-1.5 py-0.5 rounded">SIM Inside</span>}
                {repair.accessories.backCover && <span className="bg-slate-200 px-1.5 py-0.5 rounded">Back Cover</span>}
                {repair.accessories.other && <span className="bg-slate-200 px-1.5 py-0.5 rounded">{repair.accessories.other}</span>}
              </div>

              {/* Itemized Charges Table */}
              <div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-bold text-slate-600">
                      <th className="py-1.5 px-2">Description / Spare Part</th>
                      <th className="py-1.5 px-2 text-center">Qty</th>
                      <th className="py-1.5 px-2 text-right">Price</th>
                      <th className="py-1.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {repair.partsUsed.map(part => (
                      <tr key={part.id}>
                        <td className="py-2 px-2 font-medium">{part.partName}</td>
                        <td className="py-2 px-2 text-center font-mono">{part.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono">₨ {part.sellingPrice.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">₨ {part.totalSelling.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 px-2 font-medium" colSpan={3}>
                        Technician Labor & Service Workmanship
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold">
                        ₨ {repair.laborCharge.toLocaleString()}
                      </td>
                    </tr>
                    {repair.otherCharges > 0 && (
                      <tr>
                        <td className="py-2 px-2 font-medium" colSpan={3}>Consumables & Other Charges</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">₨ {repair.otherCharges.toLocaleString()}</td>
                      </tr>
                    )}
                    {repair.discount > 0 && (
                      <tr className="text-red-600">
                        <td className="py-1.5 px-2 font-medium" colSpan={3}>Special Courtesy Discount</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">- ₨ {repair.discount.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-t border-slate-300 font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono">₨ {repair.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Advance / Paid:</span>
                    <span className="font-mono">₨ {repair.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Remaining Balance:</span>
                    <span className="font-mono text-red-600">₨ {repair.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Warranty & Terms Policy */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] space-y-1 text-slate-600">
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>WARRANTY POLICY: {repair.warranty.duration.toUpperCase()}</span>
                  {repair.warranty.expiryDate && (
                    <span>Valid Until: {repair.warranty.expiryDate}</span>
                  )}
                </div>
                <p>
                  {repair.warranty.terms || 'Warranty covers technical defects in replaced components and workmanship. Physical breakage, cracks, and liquid ingress void warranty completely.'}
                </p>
                <p className="italic text-slate-500">
                  Please bring this receipt for warranty claims or future device verification.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex justify-between text-center text-[10px] text-slate-600 border-t border-slate-300">
                <div>
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span>Customer Signature / Acknowledgement</span>
                </div>
                <div>
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span>Authorized Store Manager</span>
                </div>
              </div>

              {/* Empty Feed Lines after Invoice End */}
              <div className="invoice-feed-lines pt-4 text-center select-none">
                {Array.from({ length: settings.printer?.bottomFeedLines ?? 5 }).map((_, idx) => (
                  <div key={idx} className="h-4 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
                ))}
              </div>
            </div>
          )}

          {/* 80MM THERMAL SLIP */}
          {format === 'thermal' && (
            <div className="w-72 bg-white p-4 rounded-xl shadow-lg border border-slate-200 text-slate-900 text-[11px] font-mono space-y-3 print:shadow-none print:border-none print:p-0">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm uppercase">{settings.businessName}</div>
                <div className="text-[10px]">{settings.address}</div>
                <div className="text-[10px]">Tel: {settings.phone}</div>
                <div className="font-bold text-xs pt-1">REPAIR SERVICE TOKEN</div>
                <div className="font-black text-sm">{repair.repairNo}</div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div>Date: {repair.date} {repair.time}</div>
                <div>Customer: {repair.customerName}</div>
                <div>Phone: {repair.customerPhone}</div>
                <div>Device: {repair.brand} {repair.model}</div>
                <div>IMEI: {repair.imei1 || 'N/A'}</div>
                <div>Status: {repair.status}</div>
              </div>

              <div className="text-[10px] space-y-1 border-b border-dashed border-slate-300 pb-2">
                <div><strong>Complaint:</strong> {repair.customerComplaint}</div>
                {repair.partsUsed.length > 0 && (
                  <div>
                    <strong>Parts:</strong> {repair.partsUsed.map(p => `${p.partName} (x${p.quantity})`).join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>Parts Total:</span>
                  <span>₨ {repair.partsSellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor / Service:</span>
                  <span>₨ {repair.laborCharge.toLocaleString()}</span>
                </div>
                {repair.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>- ₨ {repair.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>₨ {repair.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>PAID:</span>
                  <span>₨ {repair.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-red-700">
                  <span>BALANCE:</span>
                  <span>₨ {repair.remainingAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center text-[9px] space-y-1 text-slate-600">
                <div className="font-bold">WARRANTY: {repair.warranty.duration}</div>
                <div>No warranty on display/touch/water damage.</div>
                <div>Thank you for choosing {settings.businessName}!</div>
              </div>

              {/* Empty Feed Lines after Invoice End for Paper Cutter Clearance */}
              <div className="invoice-feed-lines mt-2 pt-2 text-center select-none">
                {Array.from({ length: settings.printer?.bottomFeedLines ?? 5 }).map((_, idx) => (
                  <div key={idx} className="h-4 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
                ))}
                <div className="border-t border-dashed border-gray-300 my-1 opacity-50 text-[9px] font-mono tracking-widest text-gray-400">
                  - - - - - - - - - - - - - - - - - - - -
                </div>
                <div className="h-3 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
