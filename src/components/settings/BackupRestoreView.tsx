import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const BackupRestoreView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreContent, setRestoreContent] = useState('');

  const handleDownloadBackup = () => {
    const backupJson = storage.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex_Mobile_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Full system backup downloaded successfully!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreContent(content);
      setShowRestoreModal(true);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restoreContent) return;
    const success = storage.importFullBackup(restoreContent);
    if (success) {
      showToast('Database restored successfully from backup!', 'success');
    }
    setShowRestoreModal(false);
    setRestoreContent('');
  };

  const handleConfirmReset = () => {
    storage.resetDemoData();
    showToast('Database reset to clean Pakistani Mobile Shop demo dataset!', 'info');
    setShowResetModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span>Database Backup, Restore & Data Synchronization</span>
        </h2>
        <p className="text-xs text-slate-400">
          Export full offline data snapshots, restore historical backups, or reseed demo records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Export Full JSON Backup</h3>
            <p className="text-xs text-slate-400">
              Download complete database containing items, IMEI records, customer contracts, sales, purchases, and audit logs.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Restore from Backup File</h3>
            <p className="text-xs text-slate-400">
              Upload a previously exported .json file to restore full inventory and transactions.
            </p>
          </div>

          <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Choose Backup File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Reset Demo Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg w-fit">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Reset Demo Data</h3>
            <p className="text-xs text-slate-400">
              Reload the clean Pakistani mobile market dataset with Samsung A15, S24 Ultra, iPhone 15 Pro Max, and sample installment contracts.
            </p>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reseed Demo Database</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        title="Confirm Database Restoration"
        message="Restoring this backup will replace current local database records with the backup file data. Are you sure you wish to proceed?"
        confirmText="Restore Now"
        isDanger={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => setShowRestoreModal(false)}
      />

      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset to Demo Data"
        message="This will reset the system state back to the original initial seed records (Samsung, iPhone, Xiaomi, active installment plans, customers). Proceed?"
        confirmText="Reset Now"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
