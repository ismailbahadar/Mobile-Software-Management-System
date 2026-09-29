import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Package, Search, AlertTriangle, 
  Check, DollarSign, ShieldAlert, Cpu, Layers 
} from 'lucide-react';
import { RepairJob, Item } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface RepairPartsModalProps {
  repair: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (repair: RepairJob) => void;
}

export const RepairPartsModal: React.FC<RepairPartsModalProps> = ({
  repair,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const items = db.items;

  // Filter items: prioritize 'Repair Spare Parts' or accessories or all
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Repair Spare Parts' | 'Other'>('Repair Spare Parts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [customPartName, setCustomPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [allowNegativeOverride, setAllowNegativeOverride] = useState(false);

  if (!isOpen || !repair) return null;

  const availableParts = items.filter(it => {
    const matchCat = categoryFilter === 'All' 
      ? true 
      : categoryFilter === 'Repair Spare Parts' 
        ? it.category === 'Repair Spare Parts' 
        : it.category !== 'Repair Spare Parts';

    const matchSearch = searchTerm.trim() === '' ||
      it.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (it.description && it.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchCat && matchSearch && it.active;
  });

  const selectedItem = items.find(it => it.id === selectedItemId);

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const it = items.find(x => x.id === itemId);
    if (it) {
      setCustomPartName(`${it.brand} ${it.model}`);
      setCostPrice(it.purchasePrice);
      setSellingPrice(it.directPrice);
    }
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    const partName = customPartName.trim() || selectedItem?.model || 'Replacement Spare Part';
    const qty = Number(quantity) || 1;

    // Check inventory stock if linked
    if (selectedItem) {
      if (selectedItem.currentStock < qty && !allowNegativeOverride) {
        showToast(
          `Insufficient stock! Only ${selectedItem.currentStock} units available for ${selectedItem.model}. Enable override to force.`,
          'error'
        );
        return;
      }
    }

    try {
      const updated = storage.addRepairPart(repair.id, {
        partItemId: selectedItem?.id,
        partName,
        quantity: qty,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
      });

      if (!updated) {
        showToast('Error attaching spare part', 'error');
        return;
      }

      showToast(`Part "${partName}" added & stock deducted!`, 'success');
      setSelectedItemId('');
      setCustomPartName('');
      setQuantity(1);
      setCostPrice(0);
      setSellingPrice(0);
      setAllowNegativeOverride(false);

      if (onUpdated) onUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Error adding part', 'error');
    }
  };

  const handleRemovePart = (partId: string) => {
    try {
      const updated = storage.removeRepairPart(repair.id, partId);
      if (updated) {
        showToast('Part removed & inventory stock restored!', 'info');
        if (onUpdated) onUpdated(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing part', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>Repair Spare Parts & Inventory Stock Deduction</span>
            </h2>
            <p className="text-xs text-slate-400">
              Ticket {repair.repairNo} • {repair.brand} {repair.model} ({repair.customerName})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Add Part Form */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Spare Part to Repair Job</span>
              </h3>
              
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  <option value="Repair Spare Parts">Spare Parts Category</option>
                  <option value="All">All Inventory Items</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleAddPart} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">
                    Select Inventory Item (Auto-deducts stock)
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={e => handleSelectItem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
                  >
                    <option value="">-- Choose Spare Part from Inventory --</option>
                    {availableParts.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.brand} {it.model} • Stock: {it.currentStock} {it.unit} (Cost: ₨ {it.purchasePrice} | Sell: ₨ {it.directPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Or Custom Part Name</label>
                  <input
                    type="text"
                    value={customPartName}
                    onChange={e => setCustomPartName(e.target.value)}
                    placeholder="e.g. iPhone 14 Pro OLED Panel"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                  {selectedItem && (
                    <span className={`text-[10px] block mt-1 ${selectedItem.currentStock < quantity ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                      In Stock: {selectedItem.currentStock} units
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Actual Purchase Cost (₨)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={e => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Customer Selling Price (₨) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-300 font-mono font-bold"
                  />
                </div>
              </div>

              {selectedItem && selectedItem.currentStock < quantity && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex-1 text-[11px] text-rose-300">
                    Warning: Stock is insufficient ({selectedItem.currentStock} available). Check override to proceed anyway.
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-200">
                    <input
                      type="checkbox"
                      checked={allowNegativeOverride}
                      onChange={e => setAllowNegativeOverride(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded bg-slate-800 border-slate-700"
                    />
                    <span>Force Override</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-md shadow-cyan-950 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deduct Stock & Attach Part</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Attached Parts Table */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center justify-between">
              <span>Attached Spare Parts List ({repair.partsUsed.length})</span>
              <span className="text-xs text-slate-400">
                Total Parts Selling: <strong className="text-emerald-400 font-mono">₨ {repair.partsSellingPrice.toLocaleString()}</strong>
              </span>
            </h3>

            {repair.partsUsed.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                No spare parts currently attached to this ticket.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="py-2 px-3">Part Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Cost</th>
                      <th className="py-2 px-3 text-right">Unit Selling</th>
                      <th className="py-2 px-3 text-right">Total Price</th>
                      <th className="py-2 px-3 text-right">Profit</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {repair.partsUsed.map(part => {
                      const totalCost = part.costPrice * part.quantity;
                      const profit = part.totalSelling - totalCost;
                      return (
                        <tr key={part.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-200 block">{part.partName}</span>
                            <span className="text-[10px] text-slate-500">
                              Added {part.addedAt} • By: {part.addedBy}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                            {part.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            ₨ {part.costPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                            ₨ {part.sellingPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            ₨ {part.totalSelling.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                            +₨ {profit.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(part.id)}
                              title="Remove part & restore stock"
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="text-xs">
            <span className="text-slate-400">Grand Total with Labor:</span>
            <span className="ml-2 font-mono font-black text-cyan-300">
              ₨ {repair.grandTotal.toLocaleString()}
            </span>
            <span className="ml-3 text-slate-500">
              (Profit: ₨ {repair.repairProfit.toLocaleString()})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
