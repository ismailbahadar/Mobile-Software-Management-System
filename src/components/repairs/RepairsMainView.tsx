import React, { useState } from 'react';
import { 
  Wrench, LayoutDashboard, Users, BarChart3, Clock, 
  Plus, Package, Search, ShieldCheck 
} from 'lucide-react';
import { RepairJob } from '../../types';
import { storage } from '../../db/storage';

// Sub Views
import { RepairDashboardView } from './RepairDashboardView';
import { RepairJobsListView } from './RepairJobsListView';
import { TechniciansView } from './TechniciansView';
import { RepairReportsView } from './RepairReportsView';

// Modals
import { NewRepairJobModal } from './NewRepairJobModal';
import { RepairDiagnosisModal } from './RepairDiagnosisModal';
import { RepairPartsModal } from './RepairPartsModal';
import { RepairPaymentModal } from './RepairPaymentModal';
import { RepairDeliveryModal } from './RepairDeliveryModal';
import { RepairInvoiceModal } from './RepairInvoiceModal';
import { RepairTrackingModal } from './RepairTrackingModal';

export type RepairSubTab = 'dashboard' | 'jobs' | 'technicians' | 'reports';

export const RepairsMainView: React.FC = () => {
  const [subTab, setSubTab] = useState<RepairSubTab>('dashboard');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Selected repair for quick modal inspection from dashboard
  const [selectedRepair, setSelectedRepair] = useState<RepairJob | null>(null);
  const [activeModal, setActiveModal] = useState<'diagnosis' | 'parts' | 'payment' | 'delivery' | 'invoice' | null>(null);

  const db = storage.getDatabase();
  const pendingJobsCount = db.repairs.filter(
    r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable'
  ).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Sub Navigation Bar */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              subTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Repair Dashboard</span>
          </button>

          <button
            onClick={() => setSubTab('jobs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              subTab === 'jobs'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Repair Jobs / Tickets</span>
            {pendingJobsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {pendingJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('technicians')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              subTab === 'technicians'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Technicians & Workload</span>
          </button>

          <button
            onClick={() => setSubTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              subTab === 'reports'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Repair Analytics & P&L</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrackingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700"
          >
            <Clock className="w-3 h-3" />
            <span>Track Timeline</span>
          </button>

          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Repair</span>
          </button>
        </div>
      </div>

      {/* Main Sub-View Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {subTab === 'dashboard' && (
          <RepairDashboardView
            onOpenNewJob={() => setShowNewJobModal(true)}
            onNavigateToJobs={() => setSubTab('jobs')}
            onNavigateToTechnicians={() => setSubTab('technicians')}
            onNavigateToReports={() => setSubTab('reports')}
            onSelectRepair={r => {
              setSelectedRepair(r);
              setActiveModal('diagnosis');
            }}
          />
        )}

        {subTab === 'jobs' && (
          <RepairJobsListView onOpenNewJob={() => setShowNewJobModal(true)} />
        )}

        {subTab === 'technicians' && <TechniciansView />}

        {subTab === 'reports' && <RepairReportsView />}
      </main>

      {/* Global Modals */}
      {showNewJobModal && (
        <NewRepairJobModal
          isOpen={true}
          onClose={() => setShowNewJobModal(false)}
          onCreated={() => {
            setSubTab('jobs');
          }}
        />
      )}

      {showTrackingModal && (
        <RepairTrackingModal
          isOpen={true}
          onClose={() => setShowTrackingModal(false)}
        />
      )}

      {activeModal === 'diagnosis' && selectedRepair && (
        <RepairDiagnosisModal
          repair={selectedRepair}
          isOpen={true}
          onClose={() => {
            setActiveModal(null);
            setSelectedRepair(null);
          }}
        />
      )}
    </div>
  );
};
