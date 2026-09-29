import React, { useState } from 'react';
import { 
  Wrench, Plus, Search, Filter, Phone, Share2, 
  Printer, DollarSign, Package, CheckCircle2, AlertCircle, 
  Trash2, Edit2, ShieldCheck, Eye, Clock, MessageSquare, Check, X 
} from 'lucide-react';
import { RepairJob, RepairStatus } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { RepairStatusBadge, PriorityBadge } from './RepairStatusBadge';
import { WhatsAppService } from '../../services/whatsappService';

// Modals
import { RepairStatusUpdateModal } from './RepairStatusUpdateModal';
import { RepairDiagnosisModal } from './RepairDiagnosisModal';
import { CustomerApprovalModal } from './CustomerApprovalModal';
import { RepairPartsModal } from './RepairPartsModal';
import { RepairPaymentModal } from './RepairPaymentModal';
import { RepairDeliveryModal } from './RepairDeliveryModal';
import { RepairInvoiceModal } from './RepairInvoiceModal';
import { RepairTrackingModal } from './RepairTrackingModal';

interface RepairJobsListViewProps {
  onOpenNewJob: () => void;
}

export const RepairJobsListView: React.FC<RepairJobsListViewProps> = ({ onOpenNewJob }) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const repairs = db.repairs || [];
  const technicians = db.technicians || [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [technicianFilter, setTechnicianFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Active Modals
  const [activeRepair, setActiveRepair] = useState<RepairJob | null>(null);
  const [modalType, setModalType] = useState<
    'status' | 'diagnosis' | 'approval' | 'parts' | 'payment' | 'delivery' | 'invoice' | 'tracking' | null
  >(null);

  // Close modals
  const closeModal = () => {
    setModalType(null);
    setActiveRepair(null);
  };

  const handleDelete = (id: string, repairNo: string) => {
    if (confirm(`Are you sure you want to delete repair ticket ${repairNo}? Any spare parts stock will be restored to inventory.`)) {
      storage.deleteRepairJob(id);
      showToast(`Repair job ${repairNo} deleted`, 'info');
    }
  };

  // Filter repairs
  const filtered = repairs.filter(r => {
    const s = search.toLowerCase();
    const matchSearch =
      r.repairNo.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s) ||
      r.customerPhone.includes(s) ||
      (r.imei1 && r.imei1.includes(s)) ||
      (r.imei2 && r.imei2.includes(s)) ||
      r.brand.toLowerCase().includes(s) ||
      r.model.toLowerCase().includes(s) ||
      r.customerComplaint.toLowerCase().includes(s);

    const matchStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending'
        ? r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable'
        : statusFilter === 'Warranty'
        ? r.warranty?.isWarrantyClaim
        : r.status === statusFilter;

    const matchTech = technicianFilter === 'All' || r.assignedTechnicianId === technicianFilter;
    const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter;

    return matchSearch && matchStatus && matchTech && matchPriority;
  });

  // KPI calculations
  const totalJobs = repairs.length;
  const pendingJobs = repairs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable').length;
  const readyJobs = repairs.filter(r => r.status === 'Ready for Delivery').length;
  const deliveredJobs = repairs.filter(r => r.status === 'Delivered').length;
  const totalReceivables = repairs
    .filter(r => r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable')
    .reduce((sum, r) => sum + r.remainingAmount, 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Mobile Repair Job Tickets</span>
          </h2>
          <p className="text-xs text-slate-400">
            End-to-end device lifecycle, diagnosis, spare parts, and customer handover
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveRepair(repairs[0] || null);
              setModalType('tracking');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Track Timeline</span>
          </button>

          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-950"
          >
            <Plus className="w-4 h-4" />
            <span>New Repair Job</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Repairs</span>
          <span className="text-lg font-black font-mono text-slate-100">{totalJobs}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">All tickets logged</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-amber-400 block uppercase font-bold">Active in Queue</span>
          <span className="text-lg font-black font-mono text-amber-300">{pendingJobs}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Under diagnosis / repair</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-lime-400 block uppercase font-bold">Ready for Pickup</span>
          <span className="text-lg font-black font-mono text-lime-300">{readyJobs}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Tested & completed</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivered</span>
          <span className="text-lg font-black font-mono text-slate-200">{deliveredJobs}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Customer collected</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-rose-400 block uppercase font-bold">Repair Receivables</span>
          <span className="text-lg font-black font-mono text-rose-400">
            ₨ {totalReceivables.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Uncollected balances</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Ticket No, Customer, Phone, IMEI, Device Model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Active Queue (Not Delivered)</option>
            <option value="Received">Received</option>
            <option value="Inspection">Inspection</option>
            <option value="Diagnosis">Diagnosis</option>
            <option value="Estimate Prepared">Estimate Prepared</option>
            <option value="Waiting for Customer Approval">Waiting for Customer Approval</option>
            <option value="Approved">Approved</option>
            <option value="Waiting for Spare Parts">Waiting for Spare Parts</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Testing">Testing</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Warranty">Warranty Claims</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={technicianFilter}
            onChange={e => setTechnicianFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="All">All Technicians</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Repairs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Ticket # & Date</th>
                <th className="py-3 px-3.5">Customer</th>
                <th className="py-3 px-3.5">Device & IMEI</th>
                <th className="py-3 px-3.5">Complaint & Diagnosis</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5">Technician</th>
                <th className="py-3 px-3.5 text-right">Charges</th>
                <th className="py-3 px-3.5 text-right">Balance</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No repair tickets match the selected search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Ticket No & Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-cyan-400 text-xs">
                          {r.repairNo}
                        </span>
                        <PriorityBadge priority={r.priority} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {r.date} {r.time}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-slate-200 block truncate max-w-[130px]" title={r.customerName}>
                        {r.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {r.customerPhone}
                      </span>
                    </td>

                    {/* Device & IMEI */}
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-slate-200 block truncate max-w-[150px]">
                        {r.brand} {r.model}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        IMEI: {r.imei1 || 'N/A'} {r.color && `(${r.color})`}
                      </span>
                    </td>

                    {/* Complaint & Diagnosis */}
                    <td className="py-3 px-3.5 max-w-[180px]">
                      <span className="text-slate-300 block truncate font-medium" title={r.customerComplaint}>
                        {r.customerComplaint}
                      </span>
                      {r.technicianDiagnosis && (
                        <span className="text-[10px] text-cyan-400 block truncate" title={r.technicianDiagnosis}>
                          Dx: {r.technicianDiagnosis}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <RepairStatusBadge status={r.status} size="sm" />
                      {r.warranty?.isWarrantyClaim && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 block mt-1 font-bold">
                          Warranty Claim
                        </span>
                      )}
                    </td>

                    {/* Technician */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-slate-200 block font-medium">
                        {r.assignedTechnicianName || 'Unassigned'}
                      </span>
                      {r.estimatedCompletionDate && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Due: {r.estimatedCompletionDate}
                        </span>
                      )}
                    </td>

                    {/* Charges */}
                    <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-100 block">
                        ₨ {r.grandTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Paid: ₨ {r.paidAmount.toLocaleString()}
                      </span>
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                      {r.remainingAmount > 0 ? (
                        <span className="font-bold text-amber-400">
                          ₨ {r.remainingAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold text-[11px]">
                          ✓ Paid
                        </span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Change Status */}
                        <button
                          onClick={() => {
                            setActiveRepair(r);
                            setModalType('status');
                          }}
                          title="Change Status & Assign Tech"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        {/* Diagnose / Estimate */}
                        <button
                          onClick={() => {
                            setActiveRepair(r);
                            setModalType('diagnosis');
                          }}
                          title="Diagnosis & Cost Estimate"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        {/* Spare Parts */}
                        <button
                          onClick={() => {
                            setActiveRepair(r);
                            setModalType('parts');
                          }}
                          title="Spare Parts from Inventory"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>

                        {/* Customer Approval */}
                        {r.status === 'Waiting for Customer Approval' && (
                          <button
                            onClick={() => {
                              setActiveRepair(r);
                              setModalType('approval');
                            }}
                            title="Customer Approval Required"
                            className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg animate-pulse"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Collect Payment */}
                        {r.remainingAmount > 0 && (
                          <button
                            onClick={() => {
                              setActiveRepair(r);
                              setModalType('payment');
                            }}
                            title="Collect Payment"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Deliver Device */}
                        {r.status !== 'Delivered' && r.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setActiveRepair(r);
                              setModalType('delivery');
                            }}
                            title="Deliver Device & Activate Warranty"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-lime-400 rounded-lg"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Invoice & Slip */}
                        <button
                          onClick={() => {
                            setActiveRepair(r);
                            setModalType('invoice');
                          }}
                          title="Print Invoice / Thermal Slip"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Message */}
                        <button
                          onClick={() => {
                            WhatsAppService.sendRepairWhatsApp(r, r.status === 'Delivered' ? 'delivered' : 'readyForCollection');
                            showToast(`WhatsApp dispatched for ${r.repairNo}`, 'success');
                          }}
                          title="Send WhatsApp Update"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(r.id, r.repairNo)}
                          title="Delete Repair Ticket"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENDER MODALS */}
      {modalType === 'status' && (
        <RepairStatusUpdateModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {modalType === 'diagnosis' && (
        <RepairDiagnosisModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
          onOpenApproval={() => setModalType('approval')}
        />
      )}

      {modalType === 'approval' && (
        <CustomerApprovalModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {modalType === 'parts' && (
        <RepairPartsModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {modalType === 'payment' && (
        <RepairPaymentModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {modalType === 'delivery' && (
        <RepairDeliveryModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
          onOpenInvoice={() => setModalType('invoice')}
        />
      )}

      {modalType === 'invoice' && (
        <RepairInvoiceModal
          repair={activeRepair}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {modalType === 'tracking' && (
        <RepairTrackingModal
          isOpen={true}
          onClose={closeModal}
          initialQuery={activeRepair?.repairNo || ''}
        />
      )}
    </div>
  );
};
