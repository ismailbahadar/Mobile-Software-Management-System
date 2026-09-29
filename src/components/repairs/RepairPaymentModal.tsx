import React, { useState } from 'react';
import { 
  X, Check, DollarSign, CreditCard, Share2, Printer, 
  Receipt, Wallet, Smartphone, Building2 
} from 'lucide-react';
import { RepairJob, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface RepairPaymentModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded?: (updated: RepairJob) => void;
}

export const RepairPaymentModal: React.FC<RepairPaymentModalProps> = ({
  repair,
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const payments = (db.repairPayments || []).filter(p => p.repairId === repair?.id);

  const [amount, setAmount] = useState<number>(repair?.remainingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');

  if (!isOpen || !repair) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (payAmt <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return;
    }

    const res = storage.addRepairPayment(repair.id, payAmt, paymentMethod, notes.trim());
    if (!res) {
      showToast('Payment recording failed', 'error');
      return;
    }

    showToast(`Payment of ₨ ${payAmt.toLocaleString()} recorded! Receipt: ${res.receiptNo}`, 'success');

    // WhatsApp Receipt
    const waText = `Payment Receipt\n\nDear ${repair.customerName},\nWe received ₨ ${payAmt.toLocaleString()} for Repair Ticket ${repair.repairNo} (${repair.brand} ${repair.model}).\nPayment Method: ${paymentMethod}\nRemaining Balance: ₨ ${res.repair.remainingAmount.toLocaleString()}\nReceipt No: ${res.receiptNo}\n\nThank you,\n${storage.getSettings().businessName}`;
    WhatsAppService.sendMessage(repair.customerWhatsApp || repair.customerPhone, repair.customerName, 'Payment Receipt', waText, repair.repairNo);

    if (onPaymentRecorded) onPaymentRecorded(res.repair);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Collect Repair Payment</h2>
              <p className="text-xs text-slate-400">
                Ticket {repair.repairNo} • {repair.customerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-5 space-y-4 text-xs">
          {/* Financial summary card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Charges</span>
              <span className="text-sm font-bold font-mono text-slate-200">
                ₨ {repair.grandTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Paid So Far</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                ₨ {repair.paidAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Balance Due</span>
              <span className="text-sm font-black font-mono text-amber-300">
                ₨ {repair.remainingAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Pay Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAmount(repair.remainingAmount)}
              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded text-[11px] font-semibold"
            >
              Full Balance (₨ {repair.remainingAmount.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setAmount(Math.round(repair.remainingAmount / 2))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
            >
              50% Partial
            </button>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Payment Amount (₨) *
            </label>
            <input
              type="number"
              min="1"
              max={repair.remainingAmount > 0 ? repair.remainingAmount + 10000 : undefined}
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold text-base"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Cash', label: 'Cash', icon: Wallet },
                { id: 'JazzCash', label: 'JazzCash', icon: Smartphone },
                { id: 'Easypaisa', label: 'Easypaisa', icon: Smartphone },
                { id: 'Bank Transfer', label: 'Bank', icon: Building2 },
              ].map(m => {
                const isSel = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2 rounded-lg border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                      isSel
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Transaction Note / Reference</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received at shop counter / JazzCash TID #981240"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          {/* Past Payments History */}
          {payments.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                Receipts Recorded ({payments.length})
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="p-2 bg-slate-950/50 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-200">{p.receiptNo}</span>
                      <span className="text-slate-400 ml-2">({p.paymentMethod})</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      ₨ {p.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Payment & Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
