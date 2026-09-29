import React, { useState } from 'react';
import { 
  BarChart3, Calendar, Download, Printer, Share2, 
  Wrench, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  DollarSign, Package, TrendingUp, User, Smartphone 
} from 'lucide-react';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';
import { RepairJob } from '../../types';
import { RepairStatusBadge } from './RepairStatusBadge';

type ReportType = 
  | 'overview'
  | 'daily_jobs'
  | 'pending_queue'
  | 'completed_delivered'
  | 'overdue'
  | 'warranty_claims'
  | 'technician_performance'
  | 'brand_analytics'
  | 'parts_consumption'
  | 'repair_pnl';

export const RepairReportsView: React.FC = () => {
  const db = storage.getDatabase();
  const repairs = db.repairs || [];
  const technicians = db.technicians || [];
  const items = db.items || [];

  const [reportType, setReportType] = useState<ReportType>('overview');
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'all'>('this_month');
  const [technicianFilter, setTechnicianFilter] = useState('All');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = todayStr.substring(0, 7);

  const filterByDate = (dStr: string) => {
    if (dateFilter === 'today') return dStr === todayStr;
    if (dateFilter === 'this_month') return dStr.startsWith(currentMonth);
    return true;
  };

  const filteredRepairs = repairs.filter(r => {
    if (!filterByDate(r.date)) return false;
    if (technicianFilter !== 'All' && r.assignedTechnicianId !== technicianFilter) return false;
    return true;
  });

  // Financial calculations
  const totalRepairRevenue = filteredRepairs.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalPartsCost = filteredRepairs.reduce((sum, r) => sum + r.partsCost, 0);
  const totalLaborRevenue = filteredRepairs.reduce((sum, r) => sum + r.laborCharge, 0);
  const totalTechnicianCost = Math.round(totalLaborRevenue * 0.3);
  const totalDirectCost = totalPartsCost + totalTechnicianCost;
  const netRepairProfit = totalRepairRevenue - totalDirectCost;

  // Mobile sales for comparative P&L
  const filteredSales = db.sales.filter(s => filterByDate(s.date));
  const mobileSalesRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const mobileSalesCOGS = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, it) => iSum + (it.purchaseCost * it.quantity), 0);
  }, 0);
  const mobileSalesProfit = mobileSalesRevenue - mobileSalesCOGS;
  const combinedBusinessProfit = mobileSalesProfit + netRepairProfit;

  // Handle Export CSV
  const handleExportCSV = () => {
    if (reportType === 'repair_pnl') {
      const rows = [
        { 'Category': 'Repair Service Revenue (Grand Total)', 'Amount (₨)': totalRepairRevenue },
        { 'Category': 'Repair Spare Parts Purchase Cost', 'Amount (₨)': totalPartsCost },
        { 'Category': 'Technician Workbench Commission & Cost', 'Amount (₨)': totalTechnicianCost },
        { 'Category': 'Total Direct Repair Cost', 'Amount (₨)': totalDirectCost },
        { 'Category': 'NET REPAIR SERVICE PROFIT', 'Amount (₨)': netRepairProfit },
        { 'Category': 'Mobile Sales Gross Profit', 'Amount (₨)': mobileSalesProfit },
        { 'Category': 'COMBINED BUSINESS PROFIT (Sales + Repairs)', 'Amount (₨)': combinedBusinessProfit },
      ];
      ExportService.exportToCSV('repair_profit_and_loss', rows);
    } else {
      const rows = filteredRepairs.map(r => ({
        'Ticket No': r.repairNo,
        'Date': r.date,
        'Customer': r.customerName,
        'Phone': r.customerPhone,
        'Brand': r.brand,
        'Model': r.model,
        'IMEI': r.imei1 || '',
        'Status': r.status,
        'Technician': r.assignedTechnicianName || 'Unassigned',
        'Parts Cost': r.partsCost,
        'Labor Charge': r.laborCharge,
        'Grand Total': r.grandTotal,
        'Paid': r.paidAmount,
        'Balance Due': r.remainingAmount,
        'Repair Profit': r.repairProfit,
        'Warranty': r.warranty?.duration || 'None',
      }));
      ExportService.exportToCSV(`repairs_report_${reportType}`, rows);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Repair Service Analytics & Executive Reports</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-dimensional repair intelligence, parts consumption, turnaround, and profit & loss
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Report Category Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        {/* Report Types Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'overview', label: 'Summary' },
            { id: 'daily_jobs', label: 'All Repair Jobs' },
            { id: 'pending_queue', label: 'Pending Queue' },
            { id: 'completed_delivered', label: 'Delivered' },
            { id: 'overdue', label: 'Overdue Jobs' },
            { id: 'warranty_claims', label: 'Warranty Repairs' },
            { id: 'technician_performance', label: 'Technician Performance' },
            { id: 'brand_analytics', label: 'Brand & Models' },
            { id: 'parts_consumption', label: 'Spare Parts Used' },
            { id: 'repair_pnl', label: 'Repair Profit & Loss' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                reportType === tab.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Tech Filter */}
        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="all">All Time</option>
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
        </div>
      </div>

      {/* REPORT CONTENT VIEWS */}
      
      {/* 1. OVERVIEW & KPIS */}
      {reportType === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Jobs Booked</span>
              <span className="text-xl font-black font-mono text-slate-100">{filteredRepairs.length}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Tickets processed</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Repair Revenue</span>
              <span className="text-xl font-black font-mono text-cyan-400">
                ₨ {totalRepairRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Customer billed amount</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Direct Cost</span>
              <span className="text-xl font-black font-mono text-slate-300">
                ₨ {totalDirectCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Parts + Tech labor split</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">Net Repair Profit</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                ₨ {netRepairProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">
                Margin: {totalRepairRevenue > 0 ? Math.round((netRepairProfit / totalRepairRevenue) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Status Breakdown funnel cards */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-100">Repair Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {[
                { status: 'Received', count: filteredRepairs.filter(r => r.status === 'Received').length },
                { status: 'Inspection', count: filteredRepairs.filter(r => r.status === 'Inspection').length },
                { status: 'Diagnosis', count: filteredRepairs.filter(r => r.status === 'Diagnosis').length },
                { status: 'Waiting for Customer Approval', count: filteredRepairs.filter(r => r.status === 'Waiting for Customer Approval').length },
                { status: 'Waiting for Spare Parts', count: filteredRepairs.filter(r => r.status === 'Waiting for Spare Parts').length },
                { status: 'Under Repair', count: filteredRepairs.filter(r => r.status === 'Under Repair').length },
                { status: 'Testing', count: filteredRepairs.filter(r => r.status === 'Testing').length },
                { status: 'Ready for Delivery', count: filteredRepairs.filter(r => r.status === 'Ready for Delivery').length },
                { status: 'Delivered', count: filteredRepairs.filter(r => r.status === 'Delivered').length },
                { status: 'Cancelled', count: filteredRepairs.filter(r => r.status === 'Cancelled').length },
              ].map(st => (
                <div key={st.status} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                  <span className="text-base font-extrabold font-mono text-slate-200 block">{st.count}</span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{st.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. REPAIR PROFIT & LOSS REPORT (Section U) */}
      {reportType === 'repair_pnl' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Independent Mobile Repair Service Profit & Loss</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Separates repair workshop income from mobile retail inventory sales
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Period: {dateFilter.toUpperCase()}</span>
            </div>

            <div className="space-y-3">
              {/* Repair Income */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <span className="font-bold text-sm text-cyan-400 block">1. Repair Service Revenue</span>
                <div className="flex justify-between text-slate-300">
                  <span>Spare Parts Selling Value to Customers:</span>
                  <span className="font-mono font-bold">
                    ₨ {filteredRepairs.reduce((s, r) => s + r.partsSellingPrice, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Technician Labor & Service Workmanship Charges:</span>
                  <span className="font-mono font-bold">₨ {totalLaborRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Consumables & Other Charges:</span>
                  <span className="font-mono font-bold">
                    ₨ {filteredRepairs.reduce((s, r) => s + r.otherCharges, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Less: Discounts Granted to Customers:</span>
                  <span className="font-mono font-bold">
                    - ₨ {filteredRepairs.reduce((s, r) => s + r.discount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-cyan-300 text-sm">
                  <span>Gross Repair Revenue:</span>
                  <span className="font-mono">₨ {totalRepairRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Repair Costs */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <span className="font-bold text-sm text-amber-400 block">2. Direct Cost of Repair Services</span>
                <div className="flex justify-between text-slate-300">
                  <span>Spare Parts Actual Purchase Cost:</span>
                  <span className="font-mono font-bold text-slate-200">₨ {totalPartsCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Technician Workbench Commission & Direct Labor Cost:</span>
                  <span className="font-mono font-bold text-slate-200">₨ {totalTechnicianCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-amber-300 text-sm">
                  <span>Total Direct Repair Cost:</span>
                  <span className="font-mono">₨ {totalDirectCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex justify-between items-center text-sm font-black text-emerald-400">
                  <span>NET REPAIR SERVICE PROFIT:</span>
                  <span className="font-mono text-base">₨ {netRepairProfit.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Mobile Sales Gross Profit (Retail/Installments)</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">
                      ₨ {mobileSalesProfit.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                    <span className="text-emerald-400 block text-[11px] font-bold">Combined Total Business Profit</span>
                    <span className="font-mono font-black text-emerald-300 text-base">
                      ₨ {combinedBusinessProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PARTS CONSUMPTION REPORT (Section V) */}
      {reportType === 'parts_consumption' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Spare Parts Consumption & Inventory Analysis</span>
            </h3>
            <span className="text-slate-400">
              Total Parts Used: <strong className="text-slate-200 font-mono">{filteredRepairs.reduce((s, r) => s + r.partsUsed.length, 0)} items</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2 px-3">Part Name</th>
                  <th className="py-2 px-3">Ticket #</th>
                  <th className="py-2 px-3">Customer & Device</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Cost Price</th>
                  <th className="py-2 px-3 text-right">Selling Price</th>
                  <th className="py-2 px-3 text-right">Total Selling</th>
                  <th className="py-2 px-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRepairs.flatMap(r => 
                  r.partsUsed.map(p => ({
                    ...p,
                    ticketNo: r.repairNo,
                    device: `${r.brand} ${r.model}`,
                    customer: r.customerName,
                  }))
                ).map((part, idx) => {
                  const cost = part.costPrice * part.quantity;
                  const profit = part.totalSelling - cost;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{part.partName}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{part.ticketNo}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {part.device} <span className="text-slate-500">({part.customer})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                        {part.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        ₨ {part.costPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        ₨ {part.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₨ {part.totalSelling.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-400 font-bold">
                        ₨ {profit.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. JOBS / TICKETS TABLE (Default / Pending / Delivered / Overdue / Warranty) */}
      {(reportType === 'daily_jobs' || reportType === 'pending_queue' || reportType === 'completed_delivered' || reportType === 'overdue' || reportType === 'warranty_claims') && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2 px-3">Ticket #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Device / IMEI</th>
                  <th className="py-2 px-3">Complaint</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Technician</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-right">Balance</th>
                  <th className="py-2 px-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRepairs
                  .filter(r => {
                    if (reportType === 'pending_queue') {
                      return r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable';
                    }
                    if (reportType === 'completed_delivered') return r.status === 'Delivered';
                    if (reportType === 'overdue') {
                      return r.status !== 'Delivered' && r.status !== 'Cancelled' && r.estimatedCompletionDate && r.estimatedCompletionDate < todayStr;
                    }
                    if (reportType === 'warranty_claims') return r.warranty?.isWarrantyClaim;
                    return true;
                  })
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{r.repairNo}</td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{r.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-200 block">{r.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{r.customerPhone}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200 block">{r.brand} {r.model}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{r.imei1 || 'No IMEI'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={r.customerComplaint}>
                        {r.customerComplaint}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <RepairStatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {r.assignedTechnicianName || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                        ₨ {r.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        ₨ {r.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₨ {r.repairProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TECHNICIAN PERFORMANCE */}
      {reportType === 'technician_performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {technicians.map(t => {
            const techJobs = repairs.filter(r => r.assignedTechnicianId === t.id && filterByDate(r.date));
            const completed = techJobs.filter(r => r.status === 'Delivered');
            const revenue = completed.reduce((s, r) => s + r.grandTotal, 0);
            const laborRevenue = completed.reduce((s, r) => s + r.laborCharge, 0);
            const commission = Math.round(laborRevenue * (t.commissionRate / 100));

            return (
              <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{t.name}</h3>
                    <p className="text-[11px] text-slate-400">{t.specializations.join(', ')}</p>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {t.commissionRate}% Commission
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Assigned</span>
                    <span className="font-bold text-sm text-slate-200">{techJobs.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Completed</span>
                    <span className="font-bold text-sm text-emerald-400">{completed.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Revenue</span>
                    <span className="font-bold text-sm text-cyan-400 font-mono">₨ {revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Earned Commission:</span>
                  <span className="font-mono text-emerald-400">₨ {commission.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. BRAND ANALYTICS */}
      {reportType === 'brand_analytics' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
          <h3 className="font-bold text-slate-100">Brand-wise Device Repairs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Apple', 'Samsung', 'Xiaomi', 'Infinix', 'Tecno', 'Vivo', 'Oppo', 'Other'].map(b => {
              const bJobs = filteredRepairs.filter(r => r.brand.toLowerCase() === b.toLowerCase());
              const bRevenue = bJobs.reduce((s, r) => s + r.grandTotal, 0);
              return (
                <div key={b} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="font-bold text-sm text-slate-200 block">{b}</span>
                  <div className="mt-1 flex justify-between text-slate-400">
                    <span>{bJobs.length} Repairs</span>
                    <span className="font-mono text-cyan-400">₨ {bRevenue.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
