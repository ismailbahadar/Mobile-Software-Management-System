import React, { useState } from 'react';
import { Plus, Search, Calendar, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { SaleOrder, OrderStatus } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const SaleOrdersView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const orders = db.saleOrders;

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [advance, setAdvance] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const filtered = orders.filter(o => 
    o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const item = db.items.find(i => i.id === selectedItemId);
    if (!item) {
      showToast('Select an item', 'error');
      return;
    }

    const total = item.directPrice * qty;
    const remaining = Math.max(0, total - advance);

    const newOrder: SaleOrder = {
      id: 'so-' + Date.now(),
      orderNo: `SO-2026-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: deliveryDate,
      customerId: 'pty-walk-in',
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '0300-0000000',
      items: [
        {
          itemId: item.id,
          itemName: `${item.brand} ${item.model}`,
          quantity: qty,
          price: item.directPrice,
          discount: 0,
          total,
        }
      ],
      subtotal: total,
      discount: 0,
      grandTotal: total,
      advancePayment: advance,
      remainingAmount: remaining,
      paymentMethod: 'Cash',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    db.saleOrders.unshift(newOrder);
    storage.logAudit('CREATE_SALE_ORDER', 'Sales', newOrder.id, `Created Sale Order ${newOrder.orderNo}`);
    showToast(`Sale Order ${newOrder.orderNo} created!`, 'success');
    setShowAddModal(false);
  };

  const handleConvertToInvoice = (order: SaleOrder) => {
    if (order.status === 'Delivered') {
      showToast('Order is already converted / delivered', 'error');
      return;
    }

    try {
      const saleItems = order.items.map(it => {
        const itemObj = storage.getItemById(it.itemId);
        return {
          id: 'ci-' + Date.now() + Math.random().toString(36).substr(2, 4),
          itemId: it.itemId,
          itemName: it.itemName,
          brand: itemObj?.brand || '',
          model: itemObj?.model || '',
          quantity: it.quantity,
          purchaseCost: itemObj?.purchasePrice || 0,
          unitPrice: it.price,
          saleType: 'Cash' as any,
          discount: it.discount || 0,
          tax: 0,
          total: it.total,
          profit: (it.price - (itemObj?.purchasePrice || 0)) * it.quantity,
        };
      });

      const inv = storage.createSale({
        customer: {
          name: order.customerName,
          mobile: order.customerPhone,
        },
        items: saleItems,
        discount: order.discount,
        tax: 0,
        paidAmount: order.grandTotal,
        paymentMethod: order.paymentMethod,
        saleType: 'Cash',
        notes: `Converted from Sale Order ${order.orderNo}`,
      });

      order.status = 'Delivered';
      showToast(`Sale Order converted to Invoice ${inv.invoiceNo}!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Error converting order', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Sale Orders</h2>
          <p className="text-xs text-slate-400">Manage bookings, pre-orders, and convert directly to sale invoices</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale Order</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Advance Paid</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No active sale orders. Click "New Sale Order" to record an advance booking.
                  </td>
                </tr>
              ) : (
                filtered.map(so => (
                  <tr key={so.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{so.orderNo}</td>
                    <td className="py-3 px-4 text-slate-300">{so.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{so.customerName} ({so.customerPhone})</td>
                    <td className="py-3 px-4 text-slate-300">{so.items.map(i => `${i.itemName} (x${i.quantity})`).join(', ')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">₨ {so.grandTotal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">₨ {so.advancePayment.toLocaleString()}</td>
                    <td className="py-3 px-4 text-amber-300">{so.expectedDeliveryDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        so.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {so.status !== 'Delivered' && (
                        <button
                          onClick={() => handleConvertToInvoice(so)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                        >
                          Convert to Invoice
                        </button>
                      )}
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
            <h3 className="text-base font-bold text-slate-100">Create Sale Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Mobile</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Select Phone Model</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Mobile --</option>
                  {db.items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.brand} {i.model} (₨ {i.directPrice.toLocaleString()})
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Advance Received (₨)</label>
                  <input
                    type="number"
                    min="0"
                    value={advance}
                    onChange={e => setAdvance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
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
