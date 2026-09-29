import React, { useState } from 'react';
import {
  Search, Printer, Share2, FileText, ArrowUpDown, Filter, Eye,
  RotateCcw, Download, Calendar, DollarSign
} from 'lucide-react';
import { SaleInvoice } from '../../types';
import { storage } from '../../db/storage';
import { SaleInvoiceModal } from './SaleInvoiceModal';
import { ExportService } from '../../services/exportService';

export const SalesListView: React.FC = () => {
  const db = storage.getDatabase();
  const sales = db.sales;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredSales = sales.filter(s => {
    const matchSearch =
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.customerPhone.includes(search) ||
      s.items.some(i => i.itemName.toLowerCase().includes(search.toLowerCase()) || (i.imei1 && i.imei1.includes(search)));

    const matchType = filterType === 'All' || s.saleType === filterType;
    const matchStatus = filterStatus === 'All' || s.paymentStatus === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPaidAmount = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalBalanceAmount = filteredSales.reduce((sum, s) => sum + s.remainingAmount, 0);

  const handleExportCSV = () => {
    const rows = filteredSales.map(s => ({
      'Invoice No': s.invoiceNo,
      'Date': s.date,
      'Time': s.time,
      'Customer': s.customerName,
      'Phone': s.customerPhone,
      'Type': s.saleType,
      'Subtotal': s.subtotal,
      'Discount': s.discount,
      'Tax': s.tax,
      'Grand Total': s.grandTotal,
      'Paid': s.paidAmount,
      'Balance': s.remainingAmount,
      'Payment Status': s.paymentStatus,
      'Payment Method': s.paymentMethod,
      'Profit': s.totalProfit,
      'Salesman': s.salesmanName,
    }));
    ExportService.exportToCSV('sales_invoices', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Sales Invoices & History</h2>
          <p className="text-xs text-slate-400">Manage invoices, reprint receipts, and track credit balances</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Sales</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">
            ₨ {totalSalesAmount.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{filteredSales.length} invoices</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Total Cash Received</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            ₨ {totalPaidAmount.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-rose-400 block font-semibold">Outstanding Receivables</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            ₨ {totalBalanceAmount.toLocaleString()}
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
            placeholder="Search by invoice #, customer name, mobile, IMEI..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Sale Type:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Types</option>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Installment">Installment</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items / IMEI</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No sales invoices found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{inv.date}</div>
                      <div className="text-[10px] text-slate-500">{inv.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300">
                          <span>{it.itemName}</span>
                          {it.imei1 && (
                            <span className="font-mono text-[10px] text-emerald-400 ml-1">
                              ({it.imei1})
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.saleType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₨ {inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                      ₨ {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={inv.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        ₨ {inv.remainingAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : inv.paymentStatus === 'Partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View & Print Invoice"
                        >
                          <Printer className="w-4 h-4 text-emerald-400" />
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

      <SaleInvoiceModal
        invoice={selectedInvoice}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};
