import React, { useState } from 'react';
import { 
  X, Search, CheckCircle2, Clock, Wrench, ShieldCheck, 
  Package, Smartphone, User, Share2, Check, ArrowRight, Sparkles 
} from 'lucide-react';
import { RepairJob, RepairStatus } from '../../types';
import { storage } from '../../db/storage';
import { RepairStatusBadge } from './RepairStatusBadge';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';

interface RepairTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const TIMELINE_STEPS: Array<{ key: RepairStatus; label: string; desc: string }> = [
  { key: 'Received', label: 'Received', desc: 'Device checked in at counter' },
  { key: 'Inspection', label: 'Inspection', desc: 'Initial physical checkup' },
  { key: 'Diagnosis', label: 'Diagnosis', desc: 'Diagnostic testing & faults found' },
  { key: 'Waiting for Customer Approval', label: 'Approval', desc: 'Estimate approved by customer' },
  { key: 'Waiting for Spare Parts', label: 'Spare Parts', desc: 'Sourcing genuine replacement parts' },
  { key: 'Under Repair', label: 'Under Repair', desc: 'Workbench technician soldering/repair' },
  { key: 'Testing', label: 'Testing & QA', desc: 'Final post-repair diagnostic tests' },
  { key: 'Ready for Delivery', label: 'Ready', desc: 'Tested and waiting for customer pickup' },
  { key: 'Delivered', label: 'Delivered', desc: 'Handed over with warranty activated' },
];

export const RepairTrackingModal: React.FC<RepairTrackingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const repairs = db.repairs;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRepair, setSelectedRepair] = useState<RepairJob | null>(() => {
    if (initialQuery.trim()) {
      const clean = initialQuery.trim().toLowerCase();
      return repairs.find(r => 
        r.repairNo.toLowerCase() === clean ||
        r.customerPhone.replace(/\D/g, '').includes(clean.replace(/\D/g, '')) ||
        (r.imei1 && r.imei1.includes(clean))
      ) || null;
    }
    return repairs[0] || null;
  });

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return;

    const found = repairs.find(r => 
      r.repairNo.toLowerCase().includes(clean) ||
      r.customerPhone.replace(/\D/g, '').includes(clean.replace(/\D/g, '')) ||
      (r.imei1 && r.imei1.includes(clean)) ||
      (r.customerName && r.customerName.toLowerCase().includes(clean))
    );

    if (found) {
      setSelectedRepair(found);
    } else {
      showToast('No repair ticket matching ticket #, phone, or IMEI', 'error');
    }
  };

  const getStepStatus = (stepKey: RepairStatus) => {
    if (!selectedRepair) return 'pending';
    const statusOrder = [
      'Received',
      'Inspection',
      'Diagnosis',
      'Estimate Prepared',
      'Waiting for Customer Approval',
      'Approved',
      'Waiting for Spare Parts',
      'Under Repair',
      'Testing',
      'Ready for Delivery',
      'Delivered'
    ];

    const currentIdx = statusOrder.indexOf(selectedRepair.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (selectedRepair.status === 'Cancelled' || selectedRepair.status === 'Returned / Unrepairable') {
      return 'cancelled';
    }

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'current';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Search */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Live Repair Job Tracker</span>
            </h2>
            <p className="text-xs text-slate-400">
              Track status by Ticket No, Customer Mobile, or IMEI
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="REP-2026-XXXX, Phone, IMEI..."
                className="w-56 px-3 py-1.5 pl-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
            >
              Track
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        {selectedRepair ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Ticket Card Summary */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-cyan-400">
                    {selectedRepair.repairNo}
                  </span>
                  <RepairStatusBadge status={selectedRepair.status} size="md" />
                </div>
                <div className="font-bold text-slate-100 text-sm">
                  {selectedRepair.brand} {selectedRepair.model} ({selectedRepair.color || 'Standard'})
                </div>
                <div className="text-[11px] text-slate-400">
                  Customer: <strong className="text-slate-200">{selectedRepair.customerName}</strong> ({selectedRepair.customerPhone})
                </div>
                {selectedRepair.imei1 && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    IMEI: {selectedRepair.imei1}
                  </div>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 space-y-1">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Est. Completion</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedRepair.estimatedCompletionDate || '1-2 Days'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Total Charges</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ₨ {selectedRepair.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Remaining Balance</span>
                  <span className="font-mono font-bold text-amber-300">
                    ₨ {selectedRepair.remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Workflow Timeline */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-200 flex items-center justify-between">
                <span>Repair Workflow Progress</span>
                <span className="text-[11px] text-slate-500">
                  Technician: {selectedRepair.assignedTechnicianName || 'In-House'}
                </span>
              </h3>

              <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 py-1">
                {TIMELINE_STEPS.map((step, idx) => {
                  const state = getStepStatus(step.key);
                  const isCurrent = state === 'current';
                  const isCompleted = state === 'completed';

                  let circleStyle = 'bg-slate-800 border-slate-700 text-slate-500';
                  let textStyle = 'text-slate-500';

                  if (isCompleted) {
                    circleStyle = 'bg-emerald-600 border-emerald-500 text-white';
                    textStyle = 'text-slate-300';
                  } else if (isCurrent) {
                    circleStyle = 'bg-cyan-500 border-cyan-300 text-slate-950 animate-pulse';
                    textStyle = 'text-cyan-300 font-bold';
                  }

                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] ${circleStyle}`}>
                        {isCompleted && '✓'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs block ${textStyle}`}>{step.label}</span>
                          <span className="text-[11px] text-slate-500">{step.desc}</span>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-bold text-[10px] border border-cyan-500/30">
                            Active Step
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History Logs */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <h3 className="font-bold text-slate-200">Audit History Timeline</h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {selectedRepair.statusHistory.map(h => (
                  <div key={h.id} className="p-2 bg-slate-900/60 rounded border border-slate-800 flex items-start justify-between text-[11px]">
                    <div>
                      <div className="font-bold text-slate-300">
                        {h.status} {h.remarks && <span className="font-normal text-slate-400">"{h.remarks}"</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">Recorded by {h.user}</div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      {h.date} {h.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Search className="w-12 h-12 text-slate-700 mb-2" />
            <p className="text-sm">Search for a repair job by entering a Ticket Number, Phone, or IMEI above.</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center shrink-0">
          {selectedRepair && (
            <button
              onClick={() => {
                WhatsAppService.sendRepairWhatsApp(selectedRepair, selectedRepair.status === 'Ready for Delivery' ? 'readyForCollection' : 'inProgress');
                showToast('Status sent to customer on WhatsApp', 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Status via WhatsApp</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
