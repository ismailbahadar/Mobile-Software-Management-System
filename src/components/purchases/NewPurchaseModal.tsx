import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Truck, Binary } from 'lucide-react';
import { Item, Party, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseCompleted?: () => void;
}

interface PurchaseRow {
  itemId: string;
  itemName: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  quantity: number;
  purchasePrice: number;
  imei1: string;
  imei2: string;
  total: number;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchaseCompleted,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const suppliers = db.parties.filter(p => p.type === 'Supplier');

  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    const item = db.items.find(i => i.id === selectedItemId);
    if (!item) {
      showToast('Select an item to add', 'error');
      return;
    }

    const newRow: PurchaseRow = {
      itemId: item.id,
      itemName: `${item.brand} ${item.model}`,
      brand: item.brand,
      model: item.model,
      color: item.color,
      storage: item.storage || '',
      quantity: 1,
      purchasePrice: item.purchasePrice,
      imei1: '',
      imei2: '',
      total: item.purchasePrice,
    };

    setRows(prev => [...prev, newRow]);
    setSelectedItemId('');
  };

  const handleRowChange = (index: number, field: keyof PurchaseRow, value: any) => {
    const updated = [...rows];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'purchasePrice') {
      updated[index].total = updated[index].quantity * updated[index].purchasePrice;
    }
    setRows(updated);
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = rows.reduce((sum, r) => sum + r.total, 0);
  const grandTotal = Math.max(0, subtotal - discount + tax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = db.parties.find(p => p.id === selectedSupplierId);
    if (!supplier) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (rows.length === 0) {
      showToast('Add at least one item to purchase', 'error');
      return;
    }

    try {
      const purchaseItems = rows.map(r => ({
        itemId: r.itemId,
        itemName: r.itemName,
        brand: r.brand,
        model: r.model,
        color: r.color,
        storage: r.storage,
        quantity: r.quantity,
        purchasePrice: r.purchasePrice,
        discount: 0,
        tax: 0,
        total: r.total,
        imeis: r.imei1 ? [{ imei1: r.imei1, imei2: r.imei2 }] : [],
      }));

      const purchase = storage.createPurchase({
        supplier,
        items: purchaseItems,
        discount,
        tax,
        paidAmount,
        paymentMethod,
        notes,
      });

      showToast(`Purchase Invoice ${purchase.invoiceNo} saved! Stock updated.`, 'success');
      if (onPurchaseCompleted) onPurchaseCompleted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving purchase', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Record New Purchase Invoice</h2>
              <p className="text-xs text-slate-400">Increase item stock and automatically register new IMEIs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Supplier *</label>
              <select
                required
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city}) — Balance: ₨ {s.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="Bank">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Quick Add Product Row */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                <option value="">-- Choose Mobile to Add --</option>
                {db.items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.brand} {i.model} ({i.color}, {i.storage}) — Cost: ₨ {i.purchasePrice.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddItemRow}
              disabled={!selectedItemId}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Table of Rows */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">IMEI 1 (Required for Phones)</th>
                  <th className="py-2.5 px-3">IMEI 2 (Optional)</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Cost Price (₨)</th>
                  <th className="py-2.5 px-3 text-right">Total (₨)</th>
                  <th className="py-2.5 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No items added yet. Select a product above and click "Add Item".
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {row.itemName}
                        <div className="text-[10px] text-slate-400">{row.color} {row.storage}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.imei1}
                          onChange={e => handleRowChange(idx, 'imei1', e.target.value)}
                          placeholder="e.g. 861234050198231"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.imei2}
                          onChange={e => handleRowChange(idx, 'imei2', e.target.value)}
                          placeholder="e.g. 861234050198232"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={e => handleRowChange(idx, 'quantity', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-slate-100 font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.purchasePrice}
                          onChange={e => handleRowChange(idx, 'purchasePrice', Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-mono text-slate-100 font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₨ {row.total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Financial summary & Paid amount */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Subtotal</span>
              <span className="font-mono font-bold text-slate-200 text-sm">₨ {subtotal.toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Paid Amount to Supplier (₨)</label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Remaining Balance (Payable)</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                ₨ {Math.max(0, grandTotal - paidAmount).toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Remarks / Note</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received via TCS cargo / Courier from Karachi"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
            />
          </div>

          {/* Footer actions */}
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
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950"
            >
              <Check className="w-4 h-4" />
              <span>Save Purchase & Update Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
