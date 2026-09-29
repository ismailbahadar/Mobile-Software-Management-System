import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Settings, Bell, Sliders, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { storage } from '../../db/storage';
import { StockAlertSettings } from '../../types';
import { useToast } from '../common/Toast';

interface InventorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const InventorySettingsModal: React.FC<InventorySettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const currentSettings = db.settings.stockAlerts || {
    enableStockAlerts: true,
    defaultLowStockThreshold: 3,
    criticalStockThreshold: 1,
    alertOnOutOfStock: true,
    notifyInDashboardBanner: true,
    notifyInHeaderBell: true,
    autoSuggestReorderQty: 5,
  };

  const [form, setForm] = useState<StockAlertSettings>({
    enableStockAlerts: currentSettings.enableStockAlerts ?? true,
    defaultLowStockThreshold: currentSettings.defaultLowStockThreshold ?? 3,
    criticalStockThreshold: currentSettings.criticalStockThreshold ?? 1,
    alertOnOutOfStock: currentSettings.alertOnOutOfStock ?? true,
    notifyInDashboardBanner: currentSettings.notifyInDashboardBanner ?? true,
    notifyInHeaderBell: currentSettings.notifyInHeaderBell ?? true,
    autoSuggestReorderQty: currentSettings.autoSuggestReorderQty ?? 5,
    categoryThresholds: currentSettings.categoryThresholds ? { ...currentSettings.categoryThresholds } : {
      'Smart Phones': 2,
      'Feature Phones': 5,
      'Accessories': 10,
      'Tablets': 2,
    },
  });

  // Calculate live impact with current form values
  const categories = ['Smart Phones', 'Feature Phones', 'Accessories', 'Tablets'];

  const impactedItems = db.items.filter(item => {
    if (!item.active) return false;
    let threshold = form.defaultLowStockThreshold;
    if (item.reorderLevel !== undefined && item.reorderLevel > 0) {
      threshold = item.reorderLevel;
    } else if (form.categoryThresholds && form.categoryThresholds[item.category] !== undefined) {
      threshold = form.categoryThresholds[item.category];
    }
    return item.currentStock <= threshold;
  });

  const outOfStockCount = impactedItems.filter(i => i.currentStock === 0).length;
  const criticalCount = impactedItems.filter(i => i.currentStock > 0 && i.currentStock <= form.criticalStockThreshold).length;

  useEffect(() => {
    if (isOpen) {
      const s = storage.getSettings().stockAlerts;
      if (s) {
        setForm({
          enableStockAlerts: s.enableStockAlerts ?? true,
          defaultLowStockThreshold: s.defaultLowStockThreshold ?? 3,
          criticalStockThreshold: s.criticalStockThreshold ?? 1,
          alertOnOutOfStock: s.alertOnOutOfStock ?? true,
          notifyInDashboardBanner: s.notifyInDashboardBanner ?? true,
          notifyInHeaderBell: s.notifyInHeaderBell ?? true,
          autoSuggestReorderQty: s.autoSuggestReorderQty ?? 5,
          categoryThresholds: s.categoryThresholds ? { ...s.categoryThresholds } : {
            'Smart Phones': 2,
            'Feature Phones': 5,
            'Accessories': 10,
            'Tablets': 2,
          },
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateStockAlertSettings(form);
    showToast('Inventory stock alert thresholds updated successfully!', 'success');
    if (onSaved) onSaved();
    onClose();
  };

  const handleCategoryThresholdChange = (cat: string, val: number) => {
    setForm(prev => ({
      ...prev,
      categoryThresholds: {
        ...(prev.categoryThresholds || {}),
        [cat]: Math.max(0, val),
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <span>Inventory Low Stock Alert Thresholds</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Settings
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure minimum quantity trigger levels and dashboard notification parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Main Activation & Banner Toggles */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block text-sm">Stock Alert Engine</span>
                <span className="text-slate-400 text-xs">
                  Automatically evaluate item quantities and alert users in the dashboard
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableStockAlerts}
                  onChange={e => setForm({ ...form, enableStockAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={form.notifyInDashboardBanner}
                  onChange={e => setForm({ ...form, notifyInDashboardBanner: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>Show Notification Banner on Dashboard</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={form.alertOnOutOfStock}
                  onChange={e => setForm({ ...form, alertOnOutOfStock: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>Critical alert when stock hits 0 (Out of Stock)</span>
              </label>
            </div>
          </div>

          {/* Primary Threshold Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-xl space-y-1.5">
              <label className="block text-slate-300 font-bold text-xs">
                Default Low Stock Threshold *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  value={form.defaultLowStockThreshold}
                  onChange={e => setForm({ ...form, defaultLowStockThreshold: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-amber-400"
                />
                <span className="text-slate-400 font-medium">units</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Items at or below this level trigger yellow warning notifications.
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-xl space-y-1.5">
              <label className="block text-slate-300 font-bold text-xs">
                Critical Threshold (Emergency) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  max="50"
                  value={form.criticalStockThreshold}
                  onChange={e => setForm({ ...form, criticalStockThreshold: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold text-base focus:outline-none focus:border-rose-400"
                />
                <span className="text-slate-400 font-medium">units</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Items at or below this quantity display red priority badges.
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-xl space-y-1.5">
              <label className="block text-slate-300 font-bold text-xs">
                Auto Reorder Suggestion Qty *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={form.autoSuggestReorderQty}
                  onChange={e => setForm({ ...form, autoSuggestReorderQty: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-400"
                />
                <span className="text-slate-400 font-medium">units</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Quantity pre-filled when clicking "Quick Restock" from dashboard.
              </p>
            </div>
          </div>

          {/* Category-Specific Thresholds */}
          <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Category-Specific Low Quantity Thresholds</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Override default threshold for specific device or accessory categories
                </p>
              </div>
              <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Customized
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categories.map(cat => (
                <div key={cat} className="p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300 truncate block">{cat}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={form.categoryThresholds?.[cat] ?? form.defaultLowStockThreshold}
                      onChange={e => handleCategoryThresholdChange(cat, Number(e.target.value))}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
                    />
                    <span className="text-[10px] text-slate-400">min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Impact Preview */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Live Alert Preview with These Thresholds:
                </div>
                <div className="text-[11px] text-slate-400">
                  <strong className="text-amber-400">{impactedItems.length} items</strong> will trigger low stock dashboard alerts ({outOfStockCount} Out of Stock, {criticalCount} Critical).
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Active Products</span>
              <span className="text-xs font-bold text-slate-200">{db.items.length} in Catalog</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Thresholds</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
