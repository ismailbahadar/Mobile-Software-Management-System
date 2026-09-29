import React, { useState } from 'react';
import { 
  X, Check, CheckCircle2, ShieldCheck, DollarSign, 
  Calendar, UserCheck, Share2, Printer, FileText, Smartphone 
} from 'lucide-react';
import { RepairJob, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface RepairDeliveryModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onDelivered?: (updated: RepairJob) => void;
  onOpenInvoice?: () => void;
}

export const RepairDeliveryModal: React.FC<RepairDeliveryModalProps> = ({
  repair,
  isOpen,
  onClose,
  onDelivered,
  onOpenInvoice,
}) => {
  const { showToast } = useToast();
  const currentUser = storage.getCurrentUser();

  const [collectPayment, setCollectPayment] = useState(repair?.remainingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [customerSignature, setCustomerSignature] = useState(`${repair?.customerName} (Verified at counter)`);
  const [staffSignature, setStaffSignature] = useState(currentUser.name);
  const [customerRemarks, setCustomerRemarks] = useState('Device received in tested and working condition.');
  const [warrantyDuration, setWarrantyDuration] = useState(repair?.warranty?.duration || '30 Days');

  if (!isOpen || !repair) return null;

  const handleDeliver = (e: React.FormEvent) => {
    e.preventDefault();

    // Update warranty duration on job
    repair.warranty.duration = warrantyDuration as any;

    const deliveredJob = storage.deliverRepair(repair.id, {
      deliveredBy: staffSignature.trim(),
      customerSignature: customerSignature.trim(),
      staffSignature: staffSignature.trim(),
      customerRemarks: customerRemarks.trim(),
      paymentAmount: Number(collectPayment) || 0,
      paymentMethod,
    });

    if (!deliveredJob) {
      showToast('Delivery confirmation failed', 'error');
      return;
    }

    showToast(`Device ${repair.brand} ${repair.model} marked DELIVERED! Warranty activated.`, 'success');

    // Send WhatsApp delivered message
    WhatsAppService.sendRepairWhatsApp(deliveredJob, 'delivered');

    if (onDelivered) onDelivered(deliveredJob);
    onClose();

    if (onOpenInvoice) {
      onOpenInvoice();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Deliver Device to Customer</h2>
              <p className="text-xs text-slate-400">
                Ticket {repair.repairNo} • {repair.customerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDeliver} className="p-5 space-y-4 text-xs">
          {/* Device & Work Verification Box */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-sm text-slate-100">{repair.brand} {repair.model}</span>
                <span className="text-[11px] text-cyan-400 block font-mono">
                  IMEI: {repair.imei1 || 'N/A'} {repair.color && `(${repair.color})`}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[11px] border border-emerald-500/30">
                Ready for Handover
              </span>
            </div>

            <div className="text-slate-300 text-[11px] pt-1 border-t border-slate-800/80 space-y-1">
              <div>
                <strong className="text-slate-400">Repair Performed:</strong> {repair.requiredRepair || repair.faultFound || 'Serviced and inspected'}
              </div>
              <div>
                <strong className="text-slate-400">Parts Replaced:</strong>{' '}
                {repair.partsUsed.length > 0 
                  ? repair.partsUsed.map(p => `${p.partName} (x${p.quantity})`).join(', ')
                  : 'Labor & diagnostic service only'}
              </div>
              <div>
                <strong className="text-slate-400">Technician:</strong> {repair.assignedTechnicianName || 'In-house workbench'}
              </div>
            </div>
          </div>

          {/* Settlement / Balance Collection */}
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Financial Settlement on Delivery</span>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Remaining Due</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  ₨ {repair.remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {repair.remainingAmount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">Collect Balance (₨) *</label>
                  <input
                    type="number"
                    min="0"
                    value={collectPayment}
                    onChange={e => setCollectPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  >
                    <option value="Cash">Cash Counter</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400 font-semibold text-center">
                ✓ Full payment has already been cleared!
              </div>
            )}
          </div>

          {/* Warranty Configuration */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Service & Parts Warranty Activation</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-calculates expiry date</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Warranty Period *</label>
                <select
                  value={warrantyDuration}
                  onChange={e => setWarrantyDuration(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                >
                  <option value="No Warranty">No Warranty</option>
                  <option value="7 Days">7 Days Warranty</option>
                  <option value="15 Days">15 Days Warranty</option>
                  <option value="30 Days">30 Days (Standard)</option>
                  <option value="60 Days">60 Days Warranty</option>
                  <option value="90 Days">90 Days Extended Warranty</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Staff Handover Officer</label>
                <input
                  type="text"
                  required
                  value={staffSignature}
                  onChange={e => setStaffSignature(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Handover Signatures & Customer Confirmation */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Customer Acceptance / Signature</label>
              <input
                type="text"
                required
                value={customerSignature}
                onChange={e => setCustomerSignature(e.target.value)}
                placeholder="e.g. Received in person by Muhammad Hamza"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Customer Feedback / Remarks</label>
              <input
                type="text"
                value={customerRemarks}
                onChange={e => setCustomerRemarks(e.target.value)}
                placeholder="e.g. Checked all functions, touch & display working crisp."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Delivery & Activate Warranty</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
