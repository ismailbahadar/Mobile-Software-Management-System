import React, { useState } from 'react';
import { Clock, Share2, AlertTriangle, CheckCircle2, Calendar, Phone, User, MessageSquare } from 'lucide-react';
import { storage } from '../../db/storage';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';

export const InstallmentRemindersView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const contracts = db.installments;

  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'soon' | 'overdue' | 'completed'>('today');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  const activeContracts = contracts.filter(c => c.status === 'Active');

  const dueToday = activeContracts.filter(c => c.nextDueDate === todayStr);
  const dueTomorrow = activeContracts.filter(c => c.nextDueDate === tomorrowStr);
  const dueSoon = activeContracts.filter(c => c.nextDueDate > tomorrowStr && c.nextDueDate <= in7DaysStr);
  const overdue = activeContracts.filter(c => c.nextDueDate < todayStr);
  const completed = contracts.filter(c => c.status === 'Completed');

  const getActiveList = () => {
    switch (activeTab) {
      case 'today': return dueToday;
      case 'tomorrow': return dueTomorrow;
      case 'soon': return dueSoon;
      case 'overdue': return overdue;
      case 'completed': return completed;
      default: return dueToday;
    }
  };

  const currentList = getActiveList();

  const handleSendReminder = (contract: any) => {
    const message = WhatsAppService.getInstallmentReminderMessage(contract);
    const result = WhatsAppService.sendMessage(
      contract.customerPhone,
      contract.customerName,
      'Installment Reminder',
      message,
      contract.contractNo
    );

    showToast(`Reminder sent via WhatsApp to ${contract.customerName} (${contract.customerPhone})`, 'success');
    if (window.confirm(`Reminder logged. Open WhatsApp Web/App to send message?`)) {
      window.open(result.waLink, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <span>Installment Reminders & Collection Center</span>
        </h2>
        <p className="text-xs text-slate-400">
          Categorized recovery queues with 1-click WhatsApp reminder notifications
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeTab === 'today'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>Due Today</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-amber-200">
            {dueToday.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeTab === 'tomorrow'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>Due Tomorrow</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-blue-200">
            {dueTomorrow.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('soon')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeTab === 'soon'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>Due Soon (7 Days)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-indigo-200">
            {dueSoon.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
          <span>Overdue Recovery</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-rose-200">
            {overdue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Fully Paid</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-emerald-200">
            {completed.length}
          </span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No customers in "{activeTab.toUpperCase()}" category.
          </div>
        ) : (
          currentList.map(contract => (
            <div
              key={contract.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {contract.contractNo}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      contract.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : activeTab === 'overdue'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    Due: {contract.nextDueDate}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{contract.customerName}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{contract.customerPhone}</span>
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Financed Device:</span>
                    <span className="text-slate-200 font-semibold">{contract.itemName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Installment Due:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₨ {contract.installmentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining Balance:</span>
                    <span className="font-mono font-bold text-rose-400">
                      ₨ {contract.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Guarantor:</span>
                    <span className="text-slate-300">{contract.guarantorName} ({contract.guarantorPhone})</span>
                  </div>
                </div>
              </div>

              {contract.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => handleSendReminder(contract)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-teal-950 transition-all active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Reminder</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
