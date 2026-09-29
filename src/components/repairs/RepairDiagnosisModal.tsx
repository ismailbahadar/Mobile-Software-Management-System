import React, { useState } from 'react';
import { 
  X, Check, Wrench, DollarSign, Calculator, Send, AlertCircle, 
  Plus, Trash2, Calendar, FileText, Share2, Sparkles, TrendingUp
} from 'lucide-react';
import { RepairJob } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface RepairDiagnosisModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (repair: RepairJob) => void;
  onOpenApproval?: () => void;
}

export const RepairDiagnosisModal: React.FC<RepairDiagnosisModalProps> = ({
  repair,
  isOpen,
  onClose,
  onUpdated,
  onOpenApproval,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;
  const technicians = db.technicians.filter(t => t.active);

  const [diagnosis, setDiagnosis] = useState(repair?.technicianDiagnosis || '');
  const [faultFound, setFaultFound] = useState(repair?.faultFound || '');
  const [requiredRepair, setRequiredRepair] = useState(repair?.requiredRepair || '');
  const [technicianNotes, setTechnicianNotes] = useState(repair?.technicianNotes || '');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState(repair?.assignedTechnicianId || '');

  // Service Charges Breakdown
  const [laborCharge, setLaborCharge] = useState(repair?.laborCharge || 1500);
  const [otherCharges, setOtherCharges] = useState(repair?.otherCharges || 0);
  const [discount, setDiscount] = useState(repair?.discount || 0);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(repair?.estimatedCompletionDate || '');

  if (!isOpen || !repair) return null;

  // Real-time calculation
  const partsCost = repair.partsCost || 0;
  const partsSellingPrice = repair.partsSellingPrice || 0;
  const customerGrandTotal = Math.max(0, partsSellingPrice + Number(laborCharge) + Number(otherCharges) - Number(discount));
  const internalLaborCost = Math.round(Number(laborCharge) * 0.3); // estimated technician split/cost
  const totalInternalCost = partsCost + internalLaborCost;
  const repairProfit = Math.max(0, customerGrandTotal - totalInternalCost);
  const remainingDue = Math.max(0, customerGrandTotal - repair.paidAmount);

  const handleSave = (changeStatusToApproval = false) => {
    const tech = technicians.find(t => t.id === assignedTechnicianId);

    const updated = storage.updateRepairDiagnosis(repair.id, {
      technicianDiagnosis: diagnosis.trim(),
      faultFound: faultFound.trim(),
      requiredRepair: requiredRepair.trim(),
      laborCharge: Number(laborCharge),
      otherCharges: Number(otherCharges),
      discount: Number(discount),
      estimatedCompletionDate,
      technicianNotes: technicianNotes.trim(),
      assignedTechnicianId: tech?.id,
      assignedTechnicianName: tech?.name || repair.assignedTechnicianName,
    });

    if (!updated) {
      showToast('Error saving technical diagnosis', 'error');
      return;
    }

    if (changeStatusToApproval) {
      storage.updateRepairStatus(
        repair.id,
        'Waiting for Customer Approval',
        `Diagnosis completed. Estimate Rs. ${customerGrandTotal.toLocaleString()} prepared for customer approval.`
      );
      WhatsAppService.sendRepairWhatsApp(updated, 'diagnosisCompleted');
      showToast('Diagnosis saved & moved to Waiting for Customer Approval', 'success');
    } else {
      if (repair.status === 'Received' || repair.status === 'Inspection') {
        storage.updateRepairStatus(repair.id, 'Diagnosis', 'Technical diagnosis updated by technician.');
      }
      showToast('Technical diagnosis & charges updated successfully', 'success');
    }

    if (onUpdated) onUpdated(updated);
    if (changeStatusToApproval && onOpenApproval) {
      onClose();
      onOpenApproval();
    } else {
      onClose();
    }
  };

  const handleSendWhatsAppQuote = () => {
    WhatsAppService.sendRepairWhatsApp(repair, 'diagnosisCompleted');
    showToast(`Estimate sent via WhatsApp to ${repair.customerName}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              <span>Technical Diagnosis & Quotation Worksheet</span>
            </h2>
            <p className="text-xs text-slate-400">
              {repair.repairNo} • {repair.brand} {repair.model} ({repair.customerName})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Customer Complaint Recall */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer Complaint:
            </span>
            <p className="text-xs text-amber-300 font-medium">{repair.customerComplaint}</p>
            {repair.problemDescription && (
              <p className="text-[11px] text-slate-400">{repair.problemDescription}</p>
            )}
          </div>

          {/* Diagnosis & Faults */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Technician Diagnosis Findings *
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Display backlight circuit operational, but OLED ribbon torn. PMIC charging rails measured 5.1V OK."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(settings.repairs?.commonDiagnoses || []).slice(0, 3).map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDiagnosis(d)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 truncate max-w-xs"
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Specific Fault Found</label>
              <input
                type="text"
                value={faultFound}
                onChange={e => setFaultFound(e.target.value)}
                placeholder="e.g. Broken OLED digitizer / Blown charging IC"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Required Repair / Action</label>
              <input
                type="text"
                value={requiredRepair}
                onChange={e => setRequiredRepair(e.target.value)}
                placeholder="e.g. Display replacement + TrueTone IC programming"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Workbench Technician</label>
              <select
                value={assignedTechnicianId}
                onChange={e => setAssignedTechnicianId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">-- Keep Current ({repair.assignedTechnicianName || 'Unassigned'}) --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specializations.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Estimated Completion Date</label>
              <input
                type="date"
                value={estimatedCompletionDate}
                onChange={e => setEstimatedCompletionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Parts Used Summary */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">
                Replaced Spare Parts ({repair.partsUsed.length} items)
              </span>
              <span className="text-[11px] text-slate-400">
                Parts Cost: <strong className="text-slate-200 font-mono">₨ {partsCost.toLocaleString()}</strong> | Selling: <strong className="text-emerald-400 font-mono">₨ {partsSellingPrice.toLocaleString()}</strong>
              </span>
            </div>
            {repair.partsUsed.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                No spare parts attached yet. Use the "Spare Parts" tab to add inventory parts (LCD, Battery, IC, Flex).
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {repair.partsUsed.map(p => (
                  <div key={p.id} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {p.partName} <span className="text-slate-500">(x{p.quantity})</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₨ {p.totalSelling.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Calculation Worksheet */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Service Charges, Cost & Profit Separation</span>
              </h3>
              <span className="text-[10px] text-slate-500">Separates Part Cost, Labor & Net Profit</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Labor / Service Charge (₨) *</label>
                <input
                  type="number"
                  min="0"
                  value={laborCharge}
                  onChange={e => setLaborCharge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Other / Consumables (₨)</label>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={e => setOtherCharges(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Special Discount (₨)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Advance Received (₨)</label>
                <input
                  type="text"
                  disabled
                  value={`₨ ${repair.paidAmount.toLocaleString()}`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Repair Cost (Parts + Tech)</span>
                <span className="text-sm font-extrabold text-slate-200 font-mono">
                  ₨ {totalInternalCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Shop direct expense</span>
              </div>

              <div>
                <span className="text-[11px] text-cyan-400 block font-semibold">Customer Repair Total</span>
                <span className="text-base font-black text-cyan-300 font-mono">
                  ₨ {customerGrandTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Remaining Due: ₨ {remainingDue.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-emerald-400 block font-semibold">Calculated Repair Profit</span>
                <span className="text-base font-black text-emerald-400 font-mono flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ₨ {repairProfit.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500 block">
                  Margin: {customerGrandTotal > 0 ? Math.round((repairProfit / customerGrandTotal) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSendWhatsAppQuote}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send Estimate via WhatsApp</span>
          </button>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold border border-slate-700"
            >
              Save Diagnosis
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-950 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit & Require Customer Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
