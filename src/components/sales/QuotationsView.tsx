import React, { useState } from 'react';
import { Plus, Search, FileText, Share2, Printer, CheckCircle2 } from 'lucide-react';
import { Quotation } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

export const QuotationsView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const quotations = db.quotations;

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('Valid for 7 days. Prices subject to dollar fluctuation.');

  const filtered = quotations.filter(q => 
    q.quotationNo.toLowerCase().includes(search.toLowerCase()) ||
    q.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const item = db.items.find(i => i.id === selectedItemId);
    if (!item) {
      showToast('Select an item', 'error');
      return;
    }

    const total = item.directPrice * qty;

    const newQ: Quotation = {
      id: 'qt-' + Date.now(),
      quotationNo: `QT-2026-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      validUntil,
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
          tax: 0,
          total,
        }
      ],
      subtotal: total,
      discount: 0,
      tax: 0,
      grandTotal: total,
      status: 'Sent',
      remarks,
      createdAt: new Date().toISOString(),
    };

    db.quotations.unshift(newQ);
    storage.logAudit('CREATE_QUOTATION', 'Sales', newQ.id, `Created quotation ${newQ.quotationNo}`);
    showToast(`Quotation ${newQ.quotationNo} generated!`, 'success');
    setShowAddModal(false);
  };

  const handleWhatsAppQuotation = (q: Quotation) => {
    const settings = storage.getSettings();
    const text = `Price Quotation\n\nDear ${q.customerName},\nHere is your quotation from ${settings.businessName}:\n\nQuote No: ${q.quotationNo}\nDate: ${q.date}\nValid Until: ${q.validUntil}\nItems: ${q.items.map(i => `${i.itemName} (x${i.quantity}) - ₨ ${i.total.toLocaleString()}`).join(', ')}\nTotal: ₨ ${q.grandTotal.toLocaleString()}\n\n${q.remarks}\n\nThank you!`;
    const res = WhatsAppService.sendMessage(q.customerPhone, q.customerName, 'Quotation', text, q.quotationNo);
    showToast('Quotation sent to WhatsApp log!', 'success');
    if (window.confirm('Open WhatsApp Web/App to send quotation text directly?')) {
      window.open(res.waLink, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Price Quotations</h2>
          <p className="text-xs text-slate-400">Generate formal price quotes for retail or wholesale clients</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by quote # or customer name..."
            className="w-full max-w-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Quoted Total</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No active quotations. Click "New Quotation" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(q => (
                  <tr key={q.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{q.quotationNo}</td>
                    <td className="py-3 px-4 text-slate-300">{q.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{q.customerName} ({q.customerPhone})</td>
                    <td className="py-3 px-4 text-slate-300">{q.items.map(i => `${i.itemName} (x${i.quantity})`).join(', ')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">₨ {q.grandTotal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-amber-300">{q.validUntil}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleWhatsAppQuotation(q)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
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
            <h3 className="text-base font-bold text-slate-100">Create Price Quotation</h3>
            <form onSubmit={handleCreateQuotation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Mobile / WhatsApp</label>
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
                  <label className="block text-slate-400 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Terms / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
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
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
