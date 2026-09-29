import React, { useState } from 'react';
import { X, Check, DollarSign, Calendar, CreditCard, Share2 } from 'lucide-react';
import { InstallmentContract, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';

interface InstallmentPaymentModalProps {
  contract: InstallmentContract | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const InstallmentPaymentModal: React.FC<InstallmentPaymentModalProps> = ({
  contract,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { showToast } = useToast();
  if (!isOpen || !contract) return null;

  const [amount, setAmount] = useState<number>(contract.installmentAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }
    if (amount > contract.remainingBalance) {
      showToast(`Amount cannot exceed remaining balance of ₨ ${contract.remainingBalance.toLocaleString()}`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const { receiptNo, contract: updatedContract } = storage.collectInstallmentPayment(
        contract.id,
        amount,
        paymentMethod,
        notes
      );

      showToast(`Installment payment of ₨ ${amount.toLocaleString()} recorded successfully! Receipt: ${receiptNo}`, 'success');

      // Dispatch WhatsApp receipt
      const waMsg = WhatsAppService.getInstallmentReceiptMessage(updatedContract, receiptNo, amount);
      const res = WhatsAppService.sendMessage(
        updatedContract.customerPhone,
        updatedContract.customerName,
        'Payment Receipt',
        waMsg,
        receiptNo
      );

      if (window.confirm(`Receipt ${receiptNo} recorded. Do you want to open WhatsApp message confirmation directly?`)) {
        window.open(res.waLink, '_blank');
      }

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Payment collection failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Receive Installment Payment</h3>
              <p className="text-xs text-slate-400">{contract.contractNo} • {contract.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Summary Box */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Device</span>
            <span className="font-semibold text-slate-200">{contract.itemName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Remaining Balance</span>
            <span className="font-bold text-rose-400 font-mono">₨ {contract.remainingBalance.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Per Installment</span>
            <span className="font-semibold text-emerald-400 font-mono">₨ {contract.installmentAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Next Due Date</span>
            <span className="font-medium text-amber-300">{contract.nextDueDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Total Paid So Far</span>
            <span className="font-medium text-slate-300 font-mono">₨ {contract.totalPaid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Customer Mobile</span>
            <span className="font-medium text-slate-300">{contract.customerPhone}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Amount (₨) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₨</span>
              <input
                type="number"
                min="100"
                max={contract.remainingBalance}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(contract.installmentAmount)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                1 Installment (₨ {contract.installmentAmount.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setAmount(contract.remainingBalance)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Full Balance (₨ {contract.remainingBalance.toLocaleString()})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Cash', 'JazzCash', 'Easypaisa', 'Bank'] as PaymentMethod[]).map(pm => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMethod === pm
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes / Trx ID / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Counter cash, JazzCash Trx ID: 12345678"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>New Remaining Balance:</span>
              <span className="font-bold text-slate-200 font-mono">
                ₨ {Math.max(0, contract.remainingBalance - amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Auto WhatsApp Confirmation:</span>
              <span className="text-emerald-400 font-medium">Enabled</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Recording...' : 'Collect ₨ ' + amount.toLocaleString()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
