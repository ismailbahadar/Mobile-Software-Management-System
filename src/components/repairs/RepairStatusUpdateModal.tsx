import React, { useState } from 'react';
import { X, Check, Clock, User, Wrench, FileText, ArrowRight } from 'lucide-react';
import { RepairJob, RepairStatus } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { RepairStatusBadge } from './RepairStatusBadge';
import { WhatsAppService } from '../../services/whatsappService';

interface RepairStatusUpdateModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (updated: RepairJob) => void;
}

const ALL_STATUSES: RepairStatus[] = [
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
  'Delivered',
  'Cancelled',
  'Returned / Unrepairable',
];

export const RepairStatusUpdateModal: React.FC<RepairStatusUpdateModalProps> = ({
  repair,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { showToast } = useToast();
  const technicians = storage.getTechnicians().filter(t => t.active);

  const [newStatus, setNewStatus] = useState<RepairStatus>(repair?.status || 'Inspection');
  const [selectedTechId, setSelectedTechId] = useState<string>(repair?.assignedTechnicianId || '');
  const [remarks, setRemarks] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  if (!isOpen || !repair) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = technicians.find(t => t.id === selectedTechId);
    const techName = tech?.name || repair.assignedTechnicianName;

    const updated = storage.updateRepairStatus(repair.id, newStatus, remarks.trim(), techName);
    if (!updated) {
      showToast('Failed to update status', 'error');
      return;
    }

    if (tech) {
      updated.assignedTechnicianId = tech.id;
      updated.assignedTechnicianName = tech.name;
      storage.persist();
    }

    showToast(`Status updated to "${newStatus}"`, 'success');

    // Auto-trigger or prompt WhatsApp if option selected
    if (sendWhatsApp) {
      if (newStatus === 'Ready for Delivery') {
        const res = WhatsAppService.sendRepairWhatsApp(updated, 'readyForCollection');
        showToast('Ready for delivery notice generated for WhatsApp', 'info');
      } else if (newStatus === 'Waiting for Spare Parts') {
        WhatsAppService.sendRepairWhatsApp(updated, 'waitingForParts');
      } else if (newStatus === 'Under Repair') {
        WhatsAppService.sendRepairWhatsApp(updated, 'inProgress');
      }
    }

    if (onStatusUpdated) onStatusUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Update Repair Status</span>
            </h3>
            <p className="text-xs text-slate-400">
              {repair.repairNo} • {repair.brand} {repair.model} ({repair.customerName})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Current Status</span>
            <RepairStatusBadge status={repair.status} size="md" />
          </div>
          <ArrowRight className="w-5 h-5 text-slate-600" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block mb-0.5">Assigned Technician</span>
            <span className="text-xs font-bold text-slate-200">
              {repair.assignedTechnicianName || 'Unassigned'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">New Status *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_STATUSES.map(st => {
                const isSelected = newStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`px-2.5 py-2 rounded-lg text-left border transition-all text-[11px] font-medium flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assign / Change Technician
            </label>
            <select
              value={selectedTechId}
              onChange={e => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            >
              <option value="">-- Keep Current Technician ({repair.assignedTechnicianName || 'None'}) --</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.specializations.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Status Change Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Screen replaced and tested successfully; bench QA completed."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl">
            <input
              type="checkbox"
              id="sendWA"
              checked={sendWhatsApp}
              onChange={e => setSendWhatsApp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="sendWA" className="text-xs text-slate-300 cursor-pointer select-none">
              Auto-generate WhatsApp notification to customer ({repair.customerWhatsApp || repair.customerPhone})
            </label>
          </div>

          {/* Status History Preview */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Status Audit History ({repair.statusHistory.length} logs)
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {repair.statusHistory.map((h, i) => (
                <div key={h.id || i} className="text-[11px] p-2 bg-slate-950/50 rounded-lg border border-slate-800/80 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <RepairStatusBadge status={h.status} size="sm" />
                      {h.remarks && <span className="text-slate-400 font-normal">"{h.remarks}"</span>}
                    </div>
                    {h.technicianName && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Tech: {h.technicianName}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-slate-500 shrink-0">
                    <div>{h.date} {h.time}</div>
                    <div>By: {h.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-950"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
