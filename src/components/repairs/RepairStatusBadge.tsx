import React from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, Wrench, Package, 
  HelpCircle, Check, XCircle, RotateCcw, ShieldCheck, Flame
} from 'lucide-react';
import { RepairStatus, RepairPriority } from '../../types';

interface RepairStatusBadgeProps {
  status: RepairStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const RepairStatusBadge: React.FC<RepairStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Received':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: Clock,
          label: 'Received',
        };
      case 'Inspection':
        return {
          bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          icon: HelpCircle,
          label: 'Inspection',
        };
      case 'Diagnosis':
        return {
          bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          icon: Wrench,
          label: 'Diagnosis',
        };
      case 'Estimate Prepared':
        return {
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: Package,
          label: 'Estimate Prepared',
        };
      case 'Waiting for Customer Approval':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse',
          icon: AlertCircle,
          label: 'Waiting Approval',
        };
      case 'Approved':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: Check,
          label: 'Approved',
        };
      case 'Waiting for Spare Parts':
        return {
          bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          icon: Package,
          label: 'Waiting for Parts',
        };
      case 'Under Repair':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: Wrench,
          label: 'Under Repair',
        };
      case 'Testing':
        return {
          bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          icon: ShieldCheck,
          label: 'Testing & QA',
        };
      case 'Ready for Delivery':
        return {
          bg: 'bg-lime-500/20 text-lime-300 border-lime-500/40 ring-1 ring-lime-500/30',
          icon: CheckCircle2,
          label: 'Ready for Pickup',
        };
      case 'Delivered':
        return {
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
          icon: CheckCircle2,
          label: 'Delivered',
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-500/15 text-red-400 border-red-500/30',
          icon: XCircle,
          label: 'Cancelled',
        };
      case 'Returned / Unrepairable':
        return {
          bg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          icon: RotateCcw,
          label: 'Unrepairable',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Clock,
          label: status,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${config.bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span className="truncate">{config.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: RepairPriority }> = ({ priority }) => {
  switch (priority) {
    case 'Urgent':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wider animate-pulse">
          <Flame className="w-2.5 h-2.5" />
          Urgent
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
          High
        </span>
      );
    case 'Normal':
      return (
        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Normal
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-800">
          Low
        </span>
      );
  }
};
