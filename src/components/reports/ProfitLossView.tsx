import React, { useState } from 'react';
import { BarChart3, Download, Printer, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';

export const ProfitLossView: React.FC = () => {
  const db = storage.getDatabase();
  const [dateFilter, setDateFilter] = useState<'today' | 'this_month' | 'all'>('this_month');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-09"

  const filterByDate = (dateStr: string) => {
    if (dateFilter === 'today') return dateStr === todayStr;
    if (dateFilter === 'this_month') return dateStr.startsWith(currentMonthPrefix);
    return true;
  };

  const filteredSales = db.sales.filter(s => filterByDate(s.date));
  const filteredPurchases = db.purchases.filter(p => filterByDate(p.date));
  const filteredExpenses = db.expenses.filter(e => filterByDate(e.date));
  const filteredInstallments = db.installments.filter(c => filterByDate(c.date));
  const filteredRepairs = (db.repairs || []).filter(r => filterByDate(r.date));

  // Direct / Regular sales revenue & COGS
  const directSalesRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const directSalesCOGS = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, it) => iSum + (it.purchaseCost * it.quantity), 0);
  }, 0);

  // Installment sales revenue & COGS (Accrual accounting: recognized on contract agreement)
  const installmentSalesRevenue = filteredInstallments.reduce((sum, c) => sum + c.totalInstallmentPrice, 0);
  const installmentSalesCOGS = filteredInstallments.reduce((sum, c) => sum + c.purchaseCost, 0);

  // Combined Gross Sales & Total COGS
  const totalSalesRevenue = directSalesRevenue + installmentSalesRevenue;
  const totalSalesCOGS = directSalesCOGS + installmentSalesCOGS;
  const mobileSalesGrossProfit = totalSalesRevenue - totalSalesCOGS;

  // REPAIR SERVICE REVENUE & COST (Section U)
  const repairServiceRevenue = filteredRepairs.reduce((sum, r) => sum + r.grandTotal, 0);
  const repairPartsCost = filteredRepairs.reduce((sum, r) => sum + r.partsCost, 0);
  const repairLaborRevenue = filteredRepairs.reduce((sum, r) => sum + r.laborCharge, 0);
  const repairTechnicianCost = Math.round(repairLaborRevenue * 0.3);
  const totalRepairDirectCost = repairPartsCost + repairTechnicianCost;
  const repairServiceProfit = repairServiceRevenue - totalRepairDirectCost;

  // Combined Business Gross Profit (Sales + Repairs)
  const totalRevenue = totalSalesRevenue + repairServiceRevenue;
  const totalCOGS = totalSalesCOGS + totalRepairDirectCost;
  const combinedGrossProfit = mobileSalesGrossProfit + repairServiceProfit;

  // Operating Expenses
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + s.discount, 0);

  // Combined Net Profit
  const netProfit = combinedGrossProfit - totalExpenses - totalDiscounts;

  const handleExportCSV = () => {
    const rows = [
      { 'Metric': 'Gross Direct Sales Revenue', 'Amount (₨)': directSalesRevenue },
      { 'Metric': 'Gross Installment Sales Revenue', 'Amount (₨)': installmentSalesRevenue },
      { 'Metric': 'Total Mobile Sales Revenue', 'Amount (₨)': totalSalesRevenue },
      { 'Metric': 'Mobile Sales Gross Profit', 'Amount (₨)': mobileSalesGrossProfit },
      { 'Metric': 'Repair Service Revenue', 'Amount (₨)': repairServiceRevenue },
      { 'Metric': 'Repair Parts & Technician Cost', 'Amount (₨)': totalRepairDirectCost },
      { 'Metric': 'Repair Service Net Profit', 'Amount (₨)': repairServiceProfit },
      { 'Metric': 'Total Combined Business Gross Profit', 'Amount (₨)': combinedGrossProfit },
      { 'Metric': 'Operating Expenses (Rent, Utilities, Staff)', 'Amount (₨)': totalExpenses },
      { 'Metric': 'Discounts Given', 'Amount (₨)': totalDiscounts },
      { 'Metric': 'COMBINED NET BUSINESS PROFIT', 'Amount (₨)': netProfit },
    ];
    ExportService.exportToCSV('profit_and_loss_statement', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Comprehensive Profit & Loss Statement</span>
          </h2>
          <p className="text-xs text-slate-400">
            Accurate multi-tier income statement with separate installment profit recognition
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-md transition-all ${
                dateFilter === 'today' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-3 py-1 rounded-md transition-all ${
                dateFilter === 'this_month' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                dateFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Revenue (Sales + Installments)</span>
          <span className="text-xl font-extrabold text-slate-100 font-mono">
            ₨ {totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Direct: ₨ {directSalesRevenue.toLocaleString()} | Inst: ₨ {installmentSalesRevenue.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Gross Profit</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            ₨ {combinedGrossProfit.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Margin: {totalRevenue > 0 ? ((combinedGrossProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-teal-400 block font-semibold">Net Profit (After All Expenses)</span>
          <span className={`text-xl font-extrabold font-mono ${netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            ₨ {netProfit.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            After deducting ₨ {totalExpenses.toLocaleString()} expenses
          </span>
        </div>
      </div>

      {/* Structured Income Statement Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl" id="printable-area">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div>
            <h3 className="font-bold text-sm text-slate-100">Apex Mobile City - Income Statement</h3>
            <span className="text-xs text-slate-400">Reporting Range: {dateFilter.replace('_', ' ').toUpperCase()}</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">All amounts in PKR (₨)</span>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Revenue Section */}
          <div className="space-y-1.5">
            <div className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider pb-1 border-b border-slate-800">
              1. REVENUE (MOBILE SALES & REPAIRS)
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Direct Cash / POS Sales</span>
              <span className="font-mono">₨ {directSalesRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Installment Sales Contract Value</span>
              <span className="font-mono">₨ {installmentSalesRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-cyan-300 font-semibold">
              <span>Mobile Repair Service Revenue (Parts + Labor)</span>
              <span className="font-mono">₨ {repairServiceRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800/80 pt-1">
              <span>Total Combined Gross Revenue:</span>
              <span className="font-mono text-emerald-400">₨ {totalRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* COGS Section */}
          <div className="space-y-1.5">
            <div className="font-bold text-amber-400 uppercase text-[11px] tracking-wider pb-1 border-b border-slate-800">
              2. COST OF GOODS SOLD & DIRECT REPAIR EXPENSES
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Direct Phones/Items Purchase Cost</span>
              <span className="font-mono">₨ {directSalesCOGS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Installment Devices Purchase Cost</span>
              <span className="font-mono">₨ {installmentSalesCOGS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 text-amber-300">
              <span>Repair Spare Parts & Technician Workbench Cost</span>
              <span className="font-mono">₨ {totalRepairDirectCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800/80 pt-1">
              <span>Total Cost of Goods & Services Sold:</span>
              <span className="font-mono text-amber-400">₨ {totalCOGS.toLocaleString()}</span>
            </div>
          </div>

          {/* Segmented Gross Profits Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Mobile Sales Profit:</span>
              <span className="font-mono font-bold text-slate-200">₨ {mobileSalesGrossProfit.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-cyan-950/30 rounded-xl border border-cyan-500/30 flex justify-between items-center text-xs">
              <span className="text-cyan-300 font-medium">Repair Service Profit:</span>
              <span className="font-mono font-bold text-cyan-300">₨ {repairServiceProfit.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/40 flex justify-between items-center text-xs">
              <span className="text-emerald-300 font-bold">Combined Gross:</span>
              <span className="font-mono font-black text-emerald-400">₨ {combinedGrossProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Gross Profit Bar */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-200">GROSS PROFIT (Revenue − COGS):</span>
            <span className="font-mono text-base text-emerald-400">₨ {combinedGrossProfit.toLocaleString()}</span>
          </div>

          {/* Operating Expenses Section */}
          <div className="space-y-1.5">
            <div className="font-bold text-rose-400 uppercase text-[11px] tracking-wider pb-1 border-b border-slate-800">
              3. OPERATING OVERHEADS & EXPENSES
            </div>
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between py-1 text-slate-400">
                <span>{exp.category}: {exp.description}</span>
                <span className="font-mono text-rose-400">₨ {exp.amount.toLocaleString()}</span>
              </div>
            ))}
            {totalDiscounts > 0 && (
              <div className="flex justify-between py-1 text-slate-400">
                <span>Sales Discounts Granted</span>
                <span className="font-mono text-rose-400">₨ {totalDiscounts.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800/80 pt-1">
              <span>Total Operating Expenses:</span>
              <span className="font-mono text-rose-400">₨ {(totalExpenses + totalDiscounts).toLocaleString()}</span>
            </div>
          </div>

          {/* Net Profit Bar */}
          <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/50 flex justify-between items-center text-base font-extrabold">
            <span className="text-emerald-200 uppercase tracking-tight">NET BUSINESS PROFIT:</span>
            <span className="font-mono text-xl text-emerald-300">₨ {netProfit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
