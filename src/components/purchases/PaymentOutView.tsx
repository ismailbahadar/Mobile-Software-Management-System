import React, { useState } from 'react';
import { Plus, Search, DollarSign, Printer, ArrowUpRight, Check } from 'lucide-react';
import { PaymentOut, PaymentMethod, Party } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const PaymentOutView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const payments = db.paymentsOut;

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [amount, setAmount] = useState<number>(20000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('Payment against wholesale inventory supply');

  const selectedSupplier = db.parties.find(p => p.id === selectedSupplierId);
  const prevBalance = selectedSupplier ? selectedSupplier.currentBalance : 0;
  const newBalance = Math.max(0, prevBalance - amount);

  const filtered = payments.filter(p =>
    p.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePaymentOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      showToast('Select a supplier party', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Enter valid amount greater than 0', 'error');
      return;
    }

    const vouNo = `VOU-2026-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newPayment: PaymentOut = {
      id: 'pout-' + Date.now(),
      voucherNo: vouNo,
      date: dateStr,
      time: timeStr,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      previousBalance: prevBalance,
      amountPaid: amount,
      newBalance,
      paymentMethod,
      referenceNo,
      remarks,
      createdAt: now.toISOString(),
    };

    // Update supplier current balance
    selectedSupplier.currentBalance = newBalance;

    db.paymentsOut.unshift(newPayment);
    storage.logAudit('PAYMENT_OUT', 'Financials', newPayment.id, `Paid ₨ ${amount.toLocaleString()} to ${selectedSupplier.name} (Voucher: ${vouNo})`);
    showToast(`Payment voucher ${vouNo} recorded!`, 'success');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-400" />
            <span>Payment Out (Supplier Vouchers)</span>
          </h2>
          <p className="text-xs text-slate-400">Record settlements to distributors and suppliers and update party ledger</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Pay Supplier (Payment Out)</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by voucher # or supplier name..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Remarks / Ref</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No supplier payment vouchers found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{p.voucherNo}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.date}</div>
                      <div className="text-[10px] text-slate-500">{p.time}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{p.supplierName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      ₨ {p.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-300">
                      ₨ {p.newBalance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {p.remarks} {p.referenceNo ? `(${p.referenceNo})` : ''}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Print Voucher"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Record Payment Out (Supplier Voucher)</span>
            </h3>

            <form onSubmit={handleCreatePaymentOut} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Supplier *</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Supplier --</option>
                  {db.parties.filter(p => p.type === 'Supplier').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable Balance: ₨ {s.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSupplier && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Current Payable to Supplier:</span>
                  <span className="font-mono font-bold text-rose-400">₨ {prevBalance.toLocaleString()}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Amount Paid (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Bank', 'Cash', 'JazzCash', 'Cheque'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 text-center rounded-lg border font-semibold ${
                        paymentMethod === pm
                          ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bank Reference / Cheque #</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  placeholder="e.g. Meezan Bank FT / Cheque 991823"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              {selectedSupplier && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Balance Remaining After Voucher:</span>
                  <span className="font-mono font-bold text-slate-200">₨ {newBalance.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                >
                  Save & Print Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
