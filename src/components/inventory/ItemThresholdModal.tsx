import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, AlertTriangle } from 'lucide-react';
import { Item } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface ItemThresholdModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ItemThresholdModal: React.FC<ItemThresholdModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [threshold, setThreshold] = useState<number>(3);

  useEffect(() => {
    if (item) {
      setThreshold(storage.getItemThreshold(item));
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = storage.updateItemThreshold(item.id, threshold);
    if (ok) {
      showToast(`Threshold for ${item.brand} ${item.model} set to ${threshold} units!`, 'success');
      if (onSaved) onSaved();
      onClose();
    }
  };

  const willTrigger = item.currentStock <= threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Adjust Item Alert Threshold</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <div className="font-bold text-slate-100 text-sm">{item.brand} {item.model}</div>
            <div className="text-slate-400 text-[11px]">
              {item.color} • {item.storage} • Current Stock: <strong className="text-emerald-400 font-mono">{item.currentStock} {item.unit}</strong>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Low Stock Alert Trigger Level (Units) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="0"
                max="500"
                value={threshold}
                onChange={e => setThreshold(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-bold font-mono text-base focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-400 font-medium">units</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              When current stock falls to or below this quantity, dashboard notifications will be dispatched.
            </p>
          </div>

          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            willTrigger
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {willTrigger
                ? `Current stock (${item.currentStock}) is at/below ${threshold}. Stock alert WILL trigger!`
                : `Current stock (${item.currentStock}) is above ${threshold}. Stock alert will be CLEARED.`
              }
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-950"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Threshold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
