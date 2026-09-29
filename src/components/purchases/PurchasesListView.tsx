import React, { useState } from 'react';
import { Plus, Search, Truck, Download, Calendar, DollarSign, Eye } from 'lucide-react';
import { PurchaseInvoice } from '../../types';
import { storage } from '../../db/storage';
import { NewPurchaseModal } from './NewPurchaseModal';
import { ExportService } from '../../services/exportService';

export const PurchasesListView: React.FC = () => {
  const db = storage.getDatabase();
  const purchases = db.purchases;

  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = purchases.filter(p =>
    p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchases = filtered.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPaid = filtered.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPayable = filtered.reduce((sum, p) => sum + p.remainingAmount, 0);

  const handleExportCSV = () => {
    const rows = filtered.map(p => ({
      'Invoice No': p.invoiceNo,
      'Date': p.date,
      'Time': p.time,
      'Supplier': p.supplierName,
      'Grand Total': p.grandTotal,
      'Paid': p.paidAmount,
      'Remaining Payable': p.remainingAmount,
      'Payment Status': p.paymentStatus,
      'Payment Method': p.paymentMethod,
    }));
    ExportService.exportToCSV('purchase_invoices', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Purchase Invoices & Inventory Intake</span>
          </h2>
          <p className="text-xs text-slate-400">Manage supplier bills, stock intake, and payables</p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Purchases</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">
            ₨ {totalPurchases.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{filtered.length} purchase bills</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Total Paid to Suppliers</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            ₨ {totalPaid.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-rose-400 block font-semibold">Supplier Payables</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            ₨ {totalPayable.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice # or supplier..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items / Registered IMEIs</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No purchase invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{p.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.date}</div>
                      <div className="text-[10px] text-slate-500">{p.time}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div>{p.supplierName}</div>
                      <div className="text-[10px] text-slate-400">{p.supplierPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {p.items.map((it, idx) => (
                        <div key={idx} className="text-[11px]">
                          {it.itemName} (x{it.quantity})
                          {it.imeis && it.imeis.length > 0 && (
                            <span className="font-mono text-[10px] text-emerald-400 ml-1">
                              [{it.imeis.map(im => im.imei1).join(', ')}]
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₨ {p.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      ₨ {p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={p.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        ₨ {p.remainingAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewPurchaseModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  );
};
