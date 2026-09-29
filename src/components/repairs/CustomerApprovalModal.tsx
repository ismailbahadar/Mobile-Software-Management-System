import React, { useState } from 'react';
import { 
  X, Check, AlertCircle, Phone, MessageSquare, Share2, 
  Clock, XCircle, DollarSign, UserCheck, ShieldAlert 
} from 'lucide-react';
import { RepairJob, CustomerApproval } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface CustomerApprovalModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (repair: RepairJob) => void;
}

export const CustomerApprovalModal: React.FC<CustomerApprovalModalProps> = ({
  repair,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [approvalMethod, setApprovalMethod] = useState<'In-Person' | 'WhatsApp' | 'Phone Call' | 'SMS'>('WhatsApp');
  const [approvedBy, setApprovedBy] = useState(repair?.customerName || '');
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !repair) return null;

  const partsSelling = repair.partsSellingPrice || 0;
  const labor = repair.laborCharge || 0;
  const discount = repair.discount || 0;
  const grandTotal = repair.grandTotal || 0;
  const advance = repair.paidAmount || 0;
  const remaining = Math.max(0, grandTotal - advance);

  const handleDecision = (decision: 'Approved' | 'Rejected' | 'Decide Later') => {
    const approvalData: CustomerApproval = {
      status: decision === 'Decide Later' ? 'Decide Later' : decision,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      approvedBy: approvedBy.trim() || repair.customerName,
      approvalMethod,
      remarks: remarks.trim() || undefined,
    };

    const updated = storage.updateCustomerApproval(repair.id, approvalData);
    if (!updated) {
      showToast('Error recording approval decision', 'error');
      return;
    }

    if (decision === 'Approved') {
      showToast('Customer approved repair estimate! Status updated to Approved.', 'success');
      WhatsAppService.sendRepairWhatsApp(updated, 'inProgress');
    } else if (decision === 'Rejected') {
      showToast('Customer rejected estimate. Ticket moved to Cancelled.', 'info');
    } else {
      showToast('Approval marked as Pending: Customer will decide later.', 'info');
    }

    if (onUpdated) onUpdated(updated);
    onClose();
  };

  const handleSendEstimateWhatsApp = () => {
    WhatsAppService.sendRepairWhatsApp(repair, 'diagnosisCompleted');
    showToast(`Estimate breakdown dispatched to ${repair.customerWhatsApp || repair.customerPhone}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Customer Repair Approval</h2>
              <p className="text-xs text-slate-400">
                Ticket {repair.repairNo} • {repair.customerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Device & Diagnosis Highlight */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
              <span>{repair.brand} {repair.model}</span>
              <span className="text-cyan-400 font-mono">IMEI: {repair.imei1 || 'N/A'}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              <strong className="text-slate-300">Diagnosis:</strong> {repair.technicianDiagnosis || repair.faultFound || 'Technical inspection completed.'}
            </p>
          </div>

          {/* Quotation Cost Breakdown */}
          <div className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center justify-between">
              <span>Estimate Cost Breakdown</span>
              <button
                type="button"
                onClick={handleSendEstimateWhatsApp}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>WhatsApp Estimate</span>
              </button>
            </h4>

            <div className="space-y-1.5 divide-y divide-slate-700/50 pt-1 text-slate-300">
              <div className="flex justify-between pt-1">
                <span>Spare Parts Selling Price:</span>
                <span className="font-mono font-bold">₨ {partsSelling.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span>Labor / Workbench Service:</span>
                <span className="font-mono font-bold">₨ {labor.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between pt-1.5 text-rose-400">
                  <span>Special Discount:</span>
                  <span className="font-mono">- ₨ {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-extrabold text-cyan-300">
                <span>Total Repair Estimate:</span>
                <span className="font-mono">₨ {grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5 text-emerald-400">
                <span>Advance Paid:</span>
                <span className="font-mono">₨ {advance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5 font-bold text-slate-100">
                <span>Remaining Payable on Delivery:</span>
                <span className="font-mono text-amber-300">₨ {remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Approval Details Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Approval Contact Method *</label>
                <select
                  value={approvalMethod}
                  onChange={e => setApprovalMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Phone Call">Phone Call / Verbal</option>
                  <option value="In-Person">In-Person Counter</option>
                  <option value="SMS">SMS Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved By (Contact Person)</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={e => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Customer Remarks / Instructions</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Customer agreed to ₨ 38,000 for original OLED display replacement. Save old parts."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 3 Decision Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleDecision('Approved')}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Approve Repair & Start</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecision('Decide Later')}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1 text-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Decide Later</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecision('Rejected')}
            className="py-2.5 px-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-xl font-semibold flex items-center justify-center gap-1 text-xs"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject / Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
