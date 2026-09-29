import React, { useState } from 'react';
import { Clock, DollarSign, Check, Printer, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const DailyClosingView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;
  const closings = db.dayClosings;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate live cash breakdown for today
  const todaySalesCash = db.sales
    .filter(s => s.date === todayStr && s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + s.paidAmount, 0);

  const todayInstallmentsCash = db.installments.flatMap(c => c.payments)
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayPaymentsInCash = db.paymentsIn
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash' && p.type !== 'Installment')
    .reduce((sum, p) => sum + p.amountReceived, 0);

  const totalCashIn = todaySalesCash + todayInstallmentsCash + todayPaymentsInCash;

  const todayPurchasesCash = db.purchases
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.paidAmount, 0);

  const todayPaymentsOutCash = db.paymentsOut
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const todayExpensesCash = db.expenses
    .filter(e => e.date === todayStr && e.paymentMethod === 'Cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashOut = todayPurchasesCash + todayPaymentsOutCash + todayExpensesCash;

  const lastClosing = closings[0];
  const openingCash = lastClosing ? lastClosing.actualCash : 50000;
  const expectedCash = openingCash + totalCashIn - totalCashOut;

  const [actualCash, setActualCash] = useState<number>(expectedCash);
  const [closingNotes, setClosingNotes] = useState('');

  const difference = actualCash - expectedCash;

  const handleSaveClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const closing = storage.saveDayClosing(actualCash, closingNotes);
    showToast(`Daily Closing for ${todayStr} recorded! Difference: ₨ ${closing.difference.toLocaleString()}`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Daily Cash Closing (Roznamcha / Shift Closing)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Reconcile physical cash drawer with sales, installments, payments in, and expenses
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Closing Statement</span>
        </button>
      </div>

      {/* Main Closing Worksheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Cash In / Out Audit Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200">Today's Cash Flow Breakdown ({todayStr})</h3>
            <span className="text-xs text-emerald-400 font-mono">Live Sync</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Opening Cash */}
            <div className="flex justify-between items-center p-2.5 bg-slate-800/60 rounded-lg">
              <span className="text-slate-300 font-semibold">Opening Cash in Drawer</span>
              <span className="font-mono font-bold text-slate-100">₨ {openingCash.toLocaleString()}</span>
            </div>

            {/* Cash Inflows */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Cash Inflows (+)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Direct Cash Sales:</span>
                <span className="font-mono text-emerald-300">₨ {todaySalesCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Installment Cash Collected:</span>
                <span className="font-mono text-emerald-300">₨ {todayInstallmentsCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Customer Credit Recoveries (Payment In):</span>
                <span className="font-mono text-emerald-300">₨ {todayPaymentsInCash.toLocaleString()}</span>
              </div>
              <div className="border-t border-emerald-500/30 pt-1 flex justify-between font-bold text-emerald-400">
                <span>Total Cash In:</span>
                <span className="font-mono">₨ {totalCashIn.toLocaleString()}</span>
              </div>
            </div>

            {/* Cash Outflows */}
            <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-2">
              <div className="font-bold text-rose-400 uppercase text-[11px] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Cash Outflows (-)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cash Paid for Purchases:</span>
                <span className="font-mono text-rose-300">₨ {todayPurchasesCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cash Paid to Suppliers (Payment Out):</span>
                <span className="font-mono text-rose-300">₨ {todayPaymentsOutCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shop Overheads / Expenses:</span>
                <span className="font-mono text-rose-300">₨ {todayExpensesCash.toLocaleString()}</span>
              </div>
              <div className="border-t border-rose-500/30 pt-1 flex justify-between font-bold text-rose-400">
                <span>Total Cash Out:</span>
                <span className="font-mono">₨ {totalCashOut.toLocaleString()}</span>
              </div>
            </div>

            {/* Expected Closing */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-extrabold text-slate-100">
              <span>Expected Cash in Drawer:</span>
              <span className="font-mono text-lg text-emerald-400">₨ {expectedCash.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Actual Cash Verification & Confirmation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200">Count Physical Cash & Reconcile</h3>
            <span className="text-xs text-amber-400">Shift Manager</span>
          </div>

          <form onSubmit={handleSaveClosing} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Physical Cash Counted in Drawer (₨) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₨</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={actualCash}
                  onChange={e => setActualCash(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold text-lg focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter total cash physically present in register / safe box at the end of the business day.
              </p>
            </div>

            {/* Reconciliation Difference Alert */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                difference === 0
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : difference > 0
                  ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div>
                <span className="text-[11px] uppercase font-bold block">
                  {difference === 0 ? 'Cash Reconciled Perfectly' : difference > 0 ? 'Cash Excess' : 'Cash Shortage'}
                </span>
                <span className="text-xs opacity-80">
                  {difference === 0
                    ? 'Drawer matches expected cash balance.'
                    : difference > 0
                    ? 'Physical cash exceeds system calculations.'
                    : 'Physical cash is lower than expected calculations.'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-extrabold block">
                  ₨ {Math.abs(difference).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Closing Remarks / Handover Notes</label>
              <textarea
                rows={3}
                value={closingNotes}
                onChange={e => setClosingNotes(e.target.value)}
                placeholder="e.g. Cash drawer verified by Waqas Ahmed. Night handover to Malik Tariq."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-amber-950 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Save & Seal Daily Closing Record</span>
            </button>
          </form>
        </div>
      </div>

      {/* Past Closings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl mt-4">
        <div className="p-3 border-b border-slate-800">
          <h3 className="font-bold text-xs text-slate-200">Historical Daily Closings Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Closed By</th>
                <th className="py-2.5 px-3 text-right">Opening Cash</th>
                <th className="py-2.5 px-3 text-right">Total In</th>
                <th className="py-2.5 px-3 text-right">Total Out</th>
                <th className="py-2.5 px-3 text-right">Expected</th>
                <th className="py-2.5 px-3 text-right">Actual Count</th>
                <th className="py-2.5 px-3 text-right">Difference</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No historical closings saved yet. Complete today's closing using the form above.
                  </td>
                </tr>
              ) : (
                closings.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{c.closingDate} {c.closingTime}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.closedBy}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">₨ {c.openingCash.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">₨ {c.totalCashIn.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">₨ {c.totalCashOut.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">₨ {c.expectedCash.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">₨ {c.actualCash.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={c.difference === 0 ? 'text-emerald-400' : c.difference > 0 ? 'text-blue-400' : 'text-rose-400'}>
                        ₨ {c.difference.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{c.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
