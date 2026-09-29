import React, { useState } from 'react';
import {
  BarChart3, Download, Printer, Filter, Calendar, DollarSign,
  Smartphone, Users, Truck, Binary, CalendarCheck
} from 'lucide-react';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';

type ReportCategory = 'sales' | 'purchases' | 'stock' | 'imei' | 'installments';

export const ReportsView: React.FC = () => {
  const db = storage.getDatabase();
  const [category, setCategory] = useState<ReportCategory>('sales');
  const [dateFilter, setDateFilter] = useState('month');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = todayStr.substring(0, 7);

  const filterDateMatch = (dateStr: string) => {
    if (dateFilter === 'today') return dateStr === todayStr;
    if (dateFilter === 'month') return dateStr.startsWith(currentMonth);
    return true; // 'all'
  };

  const handleExport = () => {
    if (category === 'sales') {
      const rows = db.sales.filter(s => filterDateMatch(s.date)).map(s => ({
        'Invoice #': s.invoiceNo,
        'Date': s.date,
        'Customer': s.customerName,
        'Sale Type': s.saleType,
        'Grand Total': s.grandTotal,
        'Paid': s.paidAmount,
        'Balance': s.remainingAmount,
        'Profit': s.totalProfit,
      }));
      ExportService.exportToCSV('sales_report', rows);
    } else if (category === 'purchases') {
      const rows = db.purchases.filter(p => filterDateMatch(p.date)).map(p => ({
        'Invoice #': p.invoiceNo,
        'Date': p.date,
        'Supplier': p.supplierName,
        'Grand Total': p.grandTotal,
        'Paid': p.paidAmount,
        'Payable': p.remainingAmount,
      }));
      ExportService.exportToCSV('purchases_report', rows);
    } else if (category === 'stock') {
      const rows = db.items.map(i => ({
        'Brand': i.brand,
        'Model': i.model,
        'Stock': i.currentStock,
        'Purchase Cost': i.purchasePrice,
        'Direct Cash Price': i.directPrice,
        'Installment Price': i.installmentPrice,
        'Total Cost Value': i.currentStock * i.purchasePrice,
        'Total Direct Retail Value': i.currentStock * i.directPrice,
      }));
      ExportService.exportToCSV('stock_valuation_report', rows);
    } else if (category === 'imei') {
      const rows = db.imeis.map(im => ({
        'IMEI 1': im.imei1,
        'Brand': im.brand,
        'Model': im.model,
        'Status': im.status,
        'Supplier': im.supplierName || '',
        'Cost': im.purchaseCost,
        'Customer': im.customerName || '',
        'Sale Price': im.salePrice || '',
      }));
      ExportService.exportToCSV('imei_status_report', rows);
    } else if (category === 'installments') {
      const rows = db.installments.map(c => ({
        'Contract #': c.contractNo,
        'Customer': c.customerName,
        'Device': c.itemName,
        'Total Price': c.totalInstallmentPrice,
        'Total Paid': c.totalPaid,
        'Remaining': c.remainingBalance,
        'Installment Amount': c.installmentAmount,
        'Next Due Date': c.nextDueDate,
        'Status': c.status,
      }));
      ExportService.exportToCSV('installments_report', rows);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Executive Business Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Generate printable PDF reports and Excel CSV sheets with custom date filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Active Report to Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Category Selectors */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'sales', label: 'Sales Reports', icon: DollarSign },
            { id: 'purchases', label: 'Purchases Reports', icon: Truck },
            { id: 'stock', label: 'Stock Valuation', icon: Smartphone },
            { id: 'imei', label: 'IMEI Reports', icon: Binary },
            { id: 'installments', label: 'Installment Reports', icon: CalendarCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Date Range:</span>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="all">All Historical Records</option>
          </select>
        </div>
      </div>

      {/* Dynamic Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl" id="printable-area">
        <div className="overflow-x-auto">
          {category === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-right">Calculated Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.sales.filter(s => filterDateMatch(s.date)).map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-100">{s.invoiceNo}</td>
                    <td className="py-2.5 px-4 text-slate-300">{s.date}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{s.customerName}</td>
                    <td className="py-2.5 px-4">{s.saleType}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">₨ {s.grandTotal.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">₨ {s.paidAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">₨ {s.remainingAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-teal-400 font-bold">₨ {s.totalProfit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'purchases' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Purchase Bill #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Total Bill</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Payable Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.purchases.filter(p => filterDateMatch(p.date)).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-100">{p.invoiceNo}</td>
                    <td className="py-2.5 px-4 text-slate-300">{p.date}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{p.supplierName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">₨ {p.grandTotal.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">₨ {p.paidAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">₨ {p.remainingAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-center">{p.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'stock' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Product Model</th>
                  <th className="py-3 px-4 text-center">In Stock Qty</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Direct Cash Price</th>
                  <th className="py-3 px-4 text-right">Installment Price</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">Total Stock Cost Value</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">Total Direct Retail Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-slate-100">{item.brand} {item.model}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">{item.currentStock}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₨ {item.purchasePrice.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₨ {item.directPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₨ {item.installmentPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">
                      ₨ {(item.currentStock * item.purchasePrice).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ₨ {(item.currentStock * item.directPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'imei' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">IMEI 1</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Purchase Cost</th>
                  <th className="py-3 px-4">Sold Customer</th>
                  <th className="py-3 px-4 text-right">Sale Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.imeis.map(im => (
                  <tr key={im.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-100">{im.imei1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{im.brand} {im.model}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        im.status === 'In Stock' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {im.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{im.supplierName || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono">₨ {im.purchaseCost.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-slate-300">{im.customerName || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {im.salePrice ? `₨ ${im.salePrice.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'installments' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4 text-right">Financed Price</th>
                  <th className="py-3 px-4 text-right">Total Recovered</th>
                  <th className="py-3 px-4 text-right font-bold text-rose-400">Remaining Balance</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.installments.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-100">{c.contractNo}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{c.customerName}</td>
                    <td className="py-2.5 px-4 text-slate-300">{c.itemName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">₨ {c.totalInstallmentPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">₨ {c.totalPaid.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">₨ {c.remainingBalance.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-amber-300">{c.nextDueDate}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
