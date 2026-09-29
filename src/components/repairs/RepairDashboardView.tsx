import React, { useState } from 'react';
import { 
  LayoutDashboard, Wrench, Clock, CheckCircle2, AlertCircle, 
  DollarSign, Package, Users, ShieldCheck, Flame, Plus, 
  Filter, Calendar, TrendingUp, ArrowRight, Share2, Printer, Search 
} from 'lucide-react';
import { storage } from '../../db/storage';
import { RepairStatusBadge, PriorityBadge } from './RepairStatusBadge';
import { RepairJob } from '../../types';

interface RepairDashboardViewProps {
  onOpenNewJob: () => void;
  onNavigateToJobs: (filterStatus?: string) => void;
  onNavigateToTechnicians: () => void;
  onNavigateToReports: () => void;
  onSelectRepair: (repair: RepairJob) => void;
}

export const RepairDashboardView: React.FC<RepairDashboardViewProps> = ({
  onOpenNewJob,
  onNavigateToJobs,
  onNavigateToTechnicians,
  onNavigateToReports,
  onSelectRepair,
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedTech, setSelectedTech] = useState<string>('all');

  const stats = storage.getRepairStats({
    timeFilter,
    technicianId: selectedTech === 'all' ? undefined : selectedTech,
  });

  const db = storage.getDatabase();
  const technicians = db.technicians || [];
  const repairs = db.repairs || [];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            <span>Mobile Repair Service Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            Workbench pipeline, diagnostic bottlenecks, technician workload, and income telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeFilter === 'today' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeFilter === 'week' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeFilter === 'month' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                timeFilter === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Technician selector */}
          <select
            value={selectedTech}
            onChange={e => setSelectedTech(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-medium"
          >
            <option value="all">All Technicians</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-950"
          >
            <Plus className="w-4 h-4" />
            <span>New Repair Job</span>
          </button>
        </div>
      </div>

      {/* Top Financial & Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Jobs */}
        <div 
          onClick={() => onNavigateToJobs('All')}
          className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-all shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Repair Jobs</span>
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">{stats.totalJobs}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Logged in period</span>
            <span className="text-cyan-400 font-semibold">View list →</span>
          </div>
        </div>

        {/* Today's Repair Income */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Today's Repair Income</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ₨ {stats.todayRepairIncome.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Cash/Bank collected today</span>
            <span className="text-emerald-400 font-semibold">Live receipt flow</span>
          </div>
        </div>

        {/* Pending Payments / Receivables */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Repair Payments</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            ₨ {stats.pendingPayments.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Due on collection</span>
            <span className="text-amber-400 font-semibold">Uncollected</span>
          </div>
        </div>

        {/* Overdue Repairs Alert */}
        <div 
          onClick={() => onNavigateToJobs('Pending')}
          className={`p-4 bg-slate-900 border rounded-2xl cursor-pointer transition-all shadow-lg ${
            stats.overdueCount > 0 ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-400">Overdue Repairs</span>
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{stats.overdueCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Past estimated date</span>
            <span className="text-rose-400 font-semibold">Needs attention →</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Workflow Status Funnel Grid */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Repair Workbench Pipeline & Status Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any stage to filter repair jobs list immediately
            </p>
          </div>
          <button
            onClick={() => onNavigateToJobs('All')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* New / Received */}
          <div
            onClick={() => onNavigateToJobs('Received')}
            className="p-3 bg-slate-950/60 border border-blue-500/30 hover:border-blue-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-blue-400 block">{stats.newCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">New Received</span>
            <span className="text-[10px] text-slate-500">Checked in</span>
          </div>

          {/* Under Diagnosis */}
          <div
            onClick={() => onNavigateToJobs('Diagnosis')}
            className="p-3 bg-slate-950/60 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-indigo-400 block">{stats.diagnosisCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Under Diagnosis</span>
            <span className="text-[10px] text-slate-500">Inspecting faults</span>
          </div>

          {/* Waiting for Approval */}
          <div
            onClick={() => onNavigateToJobs('Waiting for Customer Approval')}
            className="p-3 bg-slate-950/60 border border-amber-500/30 hover:border-amber-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-amber-400 block">{stats.waitingApprovalCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Waiting Approval</span>
            <span className="text-[10px] text-amber-500 font-semibold">Quote pending</span>
          </div>

          {/* Waiting for Parts */}
          <div
            onClick={() => onNavigateToJobs('Waiting for Spare Parts')}
            className="p-3 bg-slate-950/60 border border-orange-500/30 hover:border-orange-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-orange-400 block">{stats.waitingPartsCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Waiting for Parts</span>
            <span className="text-[10px] text-slate-500">Inventory order</span>
          </div>

          {/* Under Repair */}
          <div
            onClick={() => onNavigateToJobs('Under Repair')}
            className="p-3 bg-slate-950/60 border border-rose-500/30 hover:border-rose-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-rose-400 block">{stats.underRepairCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Under Repair</span>
            <span className="text-[10px] text-slate-500">On workbench</span>
          </div>

          {/* Ready for Delivery */}
          <div
            onClick={() => onNavigateToJobs('Ready for Delivery')}
            className="p-3 bg-slate-950/60 border border-lime-500/40 hover:border-lime-500/80 rounded-xl cursor-pointer transition-all text-center shadow-md shadow-lime-950/40 ring-1 ring-lime-500/30"
          >
            <span className="text-xl font-black font-mono text-lime-300 block">{stats.readyCount}</span>
            <span className="text-[11px] font-bold text-lime-300 block mt-0.5">Ready for Pickup</span>
            <span className="text-[10px] text-lime-500 font-semibold">Tested & OK</span>
          </div>

          {/* Delivered */}
          <div
            onClick={() => onNavigateToJobs('Delivered')}
            className="p-3 bg-slate-950/60 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-slate-200 block">{stats.deliveredCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Delivered</span>
            <span className="text-[10px] text-slate-500">Handed over</span>
          </div>

          {/* Warranty Claims */}
          <div
            onClick={() => onNavigateToJobs('Warranty')}
            className="p-3 bg-slate-950/60 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-cyan-400 block">{stats.warrantyCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Warranty Repairs</span>
            <span className="text-[10px] text-slate-500">Covered service</span>
          </div>

          {/* Total Pending Queue */}
          <div
            onClick={() => onNavigateToJobs('Pending')}
            className="p-3 bg-slate-950/60 border border-amber-500/40 hover:border-amber-500/70 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-amber-300 block">{stats.pendingCount}</span>
            <span className="text-[11px] font-bold text-slate-200 block mt-0.5">Active Queue</span>
            <span className="text-[10px] text-slate-500">All incomplete</span>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => onNavigateToJobs('Cancelled')}
            className="p-3 bg-slate-950/60 border border-rose-500/20 hover:border-rose-500/40 rounded-xl cursor-pointer transition-all text-center"
          >
            <span className="text-xl font-black font-mono text-rose-400 block">{stats.cancelledCount}</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Cancelled / Reject</span>
            <span className="text-[10px] text-slate-500">Unrepairable</span>
          </div>

          {/* Profit Earned on Delivered */}
          <div
            onClick={onNavigateToReports}
            className="sm:col-span-2 p-3 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/40 hover:border-emerald-500/80 rounded-xl cursor-pointer transition-all flex items-center justify-between px-4"
          >
            <div>
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">Realized Repair Profit</span>
              <span className="text-lg font-black font-mono text-emerald-300">
                ₨ {stats.totalProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Net after parts & tech split</span>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left (Technician Workload) & Right (Overdue & Priority Tickets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Technician Workload & Performance */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Technician Workbench Workload</span>
            </h3>
            <button
              onClick={onNavigateToTechnicians}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Manage Techs →
            </button>
          </div>

          <div className="space-y-2.5">
            {technicians.map(t => {
              const techJobs = repairs.filter(r => r.assignedTechnicianId === t.id);
              const active = techJobs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable');
              const completed = techJobs.filter(r => r.status === 'Delivered');

              return (
                <div key={t.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block text-sm">{t.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {t.specializations.slice(0, 2).join(', ')} • {t.commissionRate}% Commission
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Active</span>
                      <span className="font-mono font-bold text-amber-400">{active.length} Jobs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Delivered</span>
                      <span className="font-mono font-bold text-emerald-400">{completed.length} Done</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Urgent & Overdue Priority Queue */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Priority & Overdue Watchlist</span>
            </h3>
            <span className="text-xs text-slate-400">
              {stats.overdueJobs.length} Overdue • {repairs.filter(r => r.priority === 'Urgent').length} Urgent
            </span>
          </div>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {repairs
              .filter(r => (r.status !== 'Delivered' && r.status !== 'Cancelled') && (r.priority === 'Urgent' || (r.estimatedCompletionDate && r.estimatedCompletionDate < new Date().toISOString().split('T')[0])))
              .slice(0, 5)
              .map(r => (
                <div
                  key={r.id}
                  onClick={() => onSelectRepair(r)}
                  className="p-3 bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/70 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{r.repairNo}</span>
                      <PriorityBadge priority={r.priority} />
                      <RepairStatusBadge status={r.status} size="sm" />
                    </div>
                    <div className="font-bold text-slate-200">
                      {r.brand} {r.model} • <span className="font-normal text-slate-400">{r.customerName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">
                      {r.customerComplaint}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-rose-400 block font-bold font-mono">
                      Due: {r.estimatedCompletionDate || 'Immediate'}
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      ₨ {r.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

            {repairs.filter(r => (r.status !== 'Delivered' && r.status !== 'Cancelled') && (r.priority === 'Urgent' || (r.estimatedCompletionDate && r.estimatedCompletionDate < new Date().toISOString().split('T')[0]))).length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                ✓ No overdue or urgent bottleneck jobs currently in the workbench queue!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
