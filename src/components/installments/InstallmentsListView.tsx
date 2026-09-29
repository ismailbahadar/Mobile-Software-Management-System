import React, { useState } from 'react';
import {
  CalendarCheck, Plus, Search, Filter, Printer, Share2, CreditCard,
  User, CheckCircle2, AlertTriangle, Download, Clock
} from 'lucide-react';
import { InstallmentContract } from '../../types';
import { storage } from '../../db/storage';
import { InstallmentContractModal } from './InstallmentContractModal';
import { InstallmentPaymentModal } from './InstallmentPaymentModal';
import { InstallmentWizardModal } from './InstallmentWizardModal';
import { ExportService } from '../../services/exportService';

interface InstallmentsListViewProps {
  onOpenReminders?: () => void;
}

export const InstallmentsListView: React.FC<InstallmentsListViewProps> = ({ onOpenReminders }) => {
  const db = storage.getDatabase();
  const contracts = db.installments;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [selectedContract, setSelectedContract] = useState<InstallmentContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);

  const filtered = contracts.filter(c => {
    const matchSearch =
      c.contractNo.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerPhone.includes(search) ||
      c.customerCnic.includes(search) ||
      c.imei1.includes(search) ||
      c.itemName.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalFinanced = filtered.reduce((sum, c) => sum + c.totalInstallmentPrice, 0);
  const totalCollected = filtered.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalReceivable = filtered.reduce((sum, c) => sum + c.remainingBalance, 0);
  const expectedProfit = filtered.reduce((sum, c) => sum + c.expectedProfit, 0);

  const handleExportCSV = () => {
    const rows = filtered.map(c => ({
      'Contract No': c.contractNo,
      'Date': c.date,
      'Customer': c.customerName,
      'CNIC': c.customerCnic,
      'Phone': c.customerPhone,
      'Device': c.itemName,
      'IMEI': c.imei1,
      'Total Price': c.totalInstallmentPrice,
      'Down Payment': c.downPayment,
      'Total Paid': c.totalPaid,
      'Remaining Balance': c.remainingBalance,
      'Installment Amount': c.installmentAmount,
      'Frequency': c.installmentFrequency,
      'Next Due Date': c.nextDueDate,
      'Status': c.status,
      'Guarantor': c.guarantorName,
      'Guarantor Phone': c.guarantorPhone,
    }));
    ExportService.exportToCSV('installment_contracts', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <span>Mobile Installment Management System</span>
          </h2>
          <p className="text-xs text-slate-400">
            Track customer financing agreements, payment schedules, and overdue collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Reminders Center</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWizardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Installment Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Financed Value</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">
            ₨ {totalFinanced.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{filtered.length} contracts</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Total Recovered</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            ₨ {totalCollected.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-rose-400 block font-semibold">Remaining Recoverable</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            ₨ {totalReceivable.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-teal-400 block font-semibold">Expected Profit</span>
          <span className="text-lg font-extrabold text-teal-400 font-mono">
            ₨ {expectedProfit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by contract #, customer, CNIC, phone, IMEI..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Plans</option>
            <option value="Completed">Completed (Cleared)</option>
            <option value="Defaulted">Defaulted</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Customer & CNIC</th>
                <th className="py-3 px-4">Device & Allocated IMEI</th>
                <th className="py-3 px-4 text-right">Plan Price</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No installment contracts found. Click "New Installment Sale" to start.
                  </td>
                </tr>
              ) : (
                filtered.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      <div>{contract.contractNo}</div>
                      <div className="text-[10px] text-slate-500">{contract.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{contract.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{contract.customerCnic}</div>
                      <div className="text-[10px] text-slate-500">{contract.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{contract.itemName}</div>
                      <div className="font-mono text-[10px] text-emerald-400">
                        IMEI: {contract.imei1}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₨ {contract.totalInstallmentPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                      ₨ {contract.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={contract.remainingBalance > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        ₨ {contract.remainingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-amber-300">{contract.nextDueDate}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ₨ {contract.installmentAmount.toLocaleString()} ({contract.installmentFrequency})
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          contract.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {contract.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                            title="Collect Installment Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowContractModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View & Print Full Agreement Document"
                        >
                          <Printer className="w-4 h-4 text-slate-300" />
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

      {/* Contract Document Modal */}
      <InstallmentContractModal
        contract={selectedContract}
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onOpenPaymentModal={(c) => {
          setSelectedContract(c);
          setShowPaymentModal(true);
        }}
      />

      {/* Payment Collection Modal */}
      <InstallmentPaymentModal
        contract={selectedContract}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Wizard Modal */}
      <InstallmentWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        onContractCreated={(contract) => {
          setSelectedContract(contract);
          setShowContractModal(true);
        }}
      />
    </div>
  );
};
