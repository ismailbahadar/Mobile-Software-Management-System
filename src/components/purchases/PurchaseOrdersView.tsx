import React, { useState } from 'react';
import { Plus, Search, Truck, Check } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const PurchaseOrdersView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const pos = db.purchaseOrders;

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(5);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const filtered = pos.filter(po =>
    po.poNo.toLowerCase().includes(search.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = db.parties.find(p => p.id === selectedSupplierId);
    const item = db.items.find(i => i.id === selectedItemId);
    if (!supplier || !item) {
      showToast('Select a supplier and item', 'error');
      return;
    }

    const total = item.purchasePrice * qty;
    const newPO: PurchaseOrder = {
      id: 'po-' + Date.now(),
      poNo: `PO-2026-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      expectedDate,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: [
        {
          itemId: item.id,
          itemName: `${item.brand} ${item.model}`,
          quantity: qty,
          unitPrice: item.purchasePrice,
          total,
        }
      ],
      grandTotal: total,
      status: 'Ordered',
      createdAt: new Date().toISOString(),
    };

    db.purchaseOrders.unshift(newPO);
    storage.logAudit('CREATE_PURCHASE_ORDER', 'Purchases', newPO.id, `Created Purchase Order ${newPO.poNo}`);
    showToast(`Purchase order ${newPO.poNo} created!`, 'success');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Purchase Orders (PO)</h2>
          <p className="text-xs text-slate-400">Track orders placed with mobile distributors and importers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by PO # or supplier name..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items Ordered</th>
                <th className="py-3 px-4 text-right">Expected Cost</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active purchase orders. Click "New Purchase Order" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(po => (
                  <tr key={po.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{po.poNo}</td>
                    <td className="py-3 px-4 text-slate-300">{po.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{po.supplierName}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {po.items.map(i => `${i.itemName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₨ {po.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-amber-300">{po.expectedDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {po.status}
                      </span>
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
            <h3 className="text-base font-bold text-slate-100">Create Purchase Order</h3>
            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
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
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Select Product *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Mobile --</option>
                  {db.items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.brand} {i.model} (Cost: ₨ {i.purchasePrice.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

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
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
