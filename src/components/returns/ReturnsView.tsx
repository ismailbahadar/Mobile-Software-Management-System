import React, { useState } from 'react';
import { RefreshCw, Plus, Search, Check, Smartphone, User, Truck, DollarSign } from 'lucide-react';
import { SaleReturn, PurchaseReturn, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const ReturnsView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');

  const [search, setSearch] = useState('');
  const [showAddSaleReturn, setShowAddSaleReturn] = useState(false);
  const [showAddPurchaseReturn, setShowAddPurchaseReturn] = useState(false);

  // Sale Return Form
  const [saleInvoiceNo, setSaleInvoiceNo] = useState('');
  const [returnReason, setReturnReason] = useState('Customer changed mind / sealed box');
  const [condition, setCondition] = useState<'Good (Return to stock)' | 'Damaged' | 'Warranty Claim'>('Good (Return to stock)');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>('Cash');

  // Purchase Return Form
  const [purInvoiceNo, setPurInvoiceNo] = useState('');
  const [purReason, setPurReason] = useState('Defective piece / PTA issue');
  const [purRefundAmount, setPurRefundAmount] = useState<number>(0);

  const matchedSale = db.sales.find(s => s.invoiceNo.trim() === saleInvoiceNo.trim());
  const matchedPur = db.purchases.find(p => p.invoiceNo.trim() === purInvoiceNo.trim());

  const handleProcessSaleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedSale) {
      showToast('Sale Invoice not found', 'error');
      return;
    }

    const firstItem = matchedSale.items[0];
    const returnRecord: SaleReturn = {
      id: 'sr-' + Date.now(),
      returnNo: `SR-2026-${Date.now().toString().slice(-4)}`,
      saleInvoiceNo: matchedSale.invoiceNo,
      date: new Date().toISOString().split('T')[0],
      customerId: matchedSale.customerId,
      customerName: matchedSale.customerName,
      itemId: firstItem.itemId,
      itemName: firstItem.itemName,
      imei1: firstItem.imei1,
      quantity: 1,
      refundAmount,
      reason: returnReason,
      itemCondition: condition,
      paymentMethod: salePaymentMethod,
      createdAt: new Date().toISOString(),
    };

    // If good condition, restore stock and mark IMEI as In Stock
    if (condition === 'Good (Return to stock)') {
      const itemObj = storage.getItemById(firstItem.itemId);
      if (itemObj) itemObj.currentStock += 1;
      if (firstItem.imei1) {
        const imeiRec = storage.getIMEIByNumber(firstItem.imei1);
        if (imeiRec) {
          imeiRec.status = 'In Stock';
          imeiRec.history.push({
            date: new Date().toLocaleString('en-GB'),
            action: 'Sale Return',
            note: `Returned from invoice ${matchedSale.invoiceNo} (${returnReason})`,
            user: storage.getCurrentUser().name,
          });
        }
      }
    } else if (condition === 'Warranty Claim' && firstItem.imei1) {
      const imeiRec = storage.getIMEIByNumber(firstItem.imei1);
      if (imeiRec) imeiRec.status = 'Warranty';
    }

    db.saleReturns.unshift(returnRecord);
    storage.logAudit('SALE_RETURN', 'Returns', returnRecord.id, `Sale return ${returnRecord.returnNo} for ${matchedSale.invoiceNo} (₨ ${refundAmount.toLocaleString()})`);
    showToast(`Sale Return ${returnRecord.returnNo} processed! Stock & IMEI updated.`, 'success');
    setShowAddSaleReturn(false);
    setSaleInvoiceNo('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <span>Sales & Purchase Returns</span>
          </h2>
          <p className="text-xs text-slate-400">
            Handle warranty claims, refunds, and auto stock & IMEI status reversals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sales' ? (
            <button
              onClick={() => setShowAddSaleReturn(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-950"
            >
              <Plus className="w-4 h-4" />
              <span>New Sale Return</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddPurchaseReturn(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950"
            >
              <Plus className="w-4 h-4" />
              <span>New Purchase Return</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'sales'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Customer Sale Returns ({db.saleReturns.length})
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'purchases'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Supplier Purchase Returns ({db.purchaseReturns.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === 'sales' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Item & IMEI</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4">Condition & Action</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.saleReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No customer returns recorded.
                    </td>
                  </tr>
                ) : (
                  db.saleReturns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">{r.returnNo}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{r.saleInvoiceNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{r.customerName}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {r.itemName} {r.imei1 && <span className="font-mono text-emerald-400">({r.imei1})</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        ₨ {r.refundAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {r.itemCondition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{r.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Pur Invoice #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Item & IMEI</th>
                  <th className="py-3 px-4 text-right">Debit Note (₨)</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.purchaseReturns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No purchase returns to vendors recorded.
                    </td>
                  </tr>
                ) : (
                  db.purchaseReturns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">{r.returnNo}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{r.purchaseInvoiceNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{r.supplierName}</td>
                      <td className="py-3 px-4 text-slate-300">{r.itemName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₨ {r.refundAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{r.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sale Return Modal */}
      {showAddSaleReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Process Sale Return</span>
            </h3>

            <form onSubmit={handleProcessSaleReturn} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Enter Sale Invoice # *</label>
                <input
                  type="text"
                  required
                  value={saleInvoiceNo}
                  onChange={e => {
                    setSaleInvoiceNo(e.target.value);
                    const inv = db.sales.find(s => s.invoiceNo.trim() === e.target.value.trim());
                    if (inv) setRefundAmount(inv.paidAmount);
                  }}
                  placeholder="e.g. INV-2026-1001"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              {matchedSale && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-200">{matchedSale.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items:</span>
                    <span className="text-slate-200">{matchedSale.items.map(i => i.itemName).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice Total:</span>
                    <span className="font-mono text-emerald-400 font-bold">₨ {matchedSale.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Condition & Inventory Action</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Good (Return to stock)">Good (Return item & IMEI back to Stock)</option>
                  <option value="Warranty Claim">Warranty Claim (Send to vendor/company)</option>
                  <option value="Damaged">Damaged / Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Refund Amount (₨) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={refundAmount}
                  onChange={e => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Refund Payment Method</label>
                <select
                  value={salePaymentMethod}
                  onChange={e => setSalePaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Easypaisa">Easypaisa</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Return Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSaleReturn(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
