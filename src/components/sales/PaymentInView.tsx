import React, { useState } from 'react';
import { Plus, Search, DollarSign, Printer, Share2, ArrowDownLeft, Check } from 'lucide-react';
import { PaymentIn, PaymentMethod, Party } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

export const PaymentInView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const payments = db.paymentsIn;

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('Payment against outstanding balance');
  const [paymentType, setPaymentType] = useState<'Customer Credit' | 'Advance' | 'Other'>('Customer Credit');

  const selectedCustomer = db.parties.find(p => p.id === selectedCustomerId);
  const prevBalance = selectedCustomer ? selectedCustomer.currentBalance : 0;
  const newBalance = Math.max(0, prevBalance - amount);

  const filtered = payments.filter(p => 
    p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    p.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePaymentIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('Select a customer party', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Enter valid amount greater than 0', 'error');
      return;
    }

    const recNo = `${db.settings.receiptPrefix}${db.settings.nextReceiptNum++}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newPayment: PaymentIn = {
      id: 'rec-' + Date.now(),
      receiptNo: recNo,
      date: dateStr,
      time: timeStr,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      previousBalance: prevBalance,
      amountReceived: amount,
      newBalance,
      paymentMethod,
      referenceNo,
      remarks,
      type: paymentType,
      createdAt: now.toISOString(),
    };

    // Update customer current balance
    selectedCustomer.currentBalance = newBalance;

    db.paymentsIn.unshift(newPayment);
    storage.logAudit('PAYMENT_IN', 'Financials', newPayment.id, `Received ₨ ${amount.toLocaleString()} from ${selectedCustomer.name} (Receipt: ${recNo})`);
    
    // Dispatch WhatsApp
    const settings = storage.getSettings();
    const waText = WhatsAppService.compileTemplate(settings.whatsapp.templates.paymentInReceipt, {
      customer_name: selectedCustomer.name,
      shop_name: settings.businessName,
      receipt_no: recNo,
      date: dateStr,
      amount: `₨ ${amount.toLocaleString()}`,
      balance: `₨ ${newBalance.toLocaleString()}`,
      payment_method: paymentMethod,
    });
    WhatsAppService.sendMessage(selectedCustomer.mobile, selectedCustomer.name, 'Payment Receipt', waText, recNo);

    showToast(`Payment receipt ${recNo} recorded!`, 'success');
    setShowAddModal(false);
  };

  const handlePrintReceipt = (p: PaymentIn) => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            <span>Payment In (Customer Receipts)</span>
          </h2>
          <p className="text-xs text-slate-400">Receive collections from credit and installment customers and update party ledger</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Payment (Payment In)</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by receipt # or customer name..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Remarks / Ref</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{p.receiptNo}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.date}</div>
                      <div className="text-[10px] text-slate-500">{p.time}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{p.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      ₨ {p.amountReceived.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Print Receipt"
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
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Record Payment In (Receipt)</span>
            </h3>

            <form onSubmit={handleCreatePaymentIn} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Customer Party *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Customer --</option>
                  {db.parties.filter(p => p.type.includes('Customer')).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: ₨ {p.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Previous Outstanding Balance:</span>
                  <span className="font-mono font-bold text-rose-400">₨ {prevBalance.toLocaleString()}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Amount Received (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'Bank', 'JazzCash', 'Easypaisa'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 text-center rounded-lg border font-semibold ${
                        paymentMethod === pm
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  placeholder="e.g. Trx ID: 12345678"
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

              {selectedCustomer && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">New Balance After Receipt:</span>
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Save & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
