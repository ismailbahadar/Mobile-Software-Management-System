import React, { useState } from 'react';
import {
  AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ShoppingBag,
  Sliders, MessageSquare, Plus, ArrowRight, X, Sparkles, RefreshCw
} from 'lucide-react';
import { storage } from '../../db/storage';
import { MainTab } from '../layout/Sidebar';
import { useToast } from '../common/Toast';
import { Item } from '../../types';

interface StockAlertBannerProps {
  onNavigate: (tab: MainTab) => void;
  onOpenSettingsModal: () => void;
  onOpenItemThresholdModal: (item: Item) => void;
}

export const StockAlertBanner: React.FC<StockAlertBannerProps> = ({
  onNavigate,
  onOpenSettingsModal,
  onOpenItemThresholdModal,
}) => {
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const stats = storage.getStockAlertStats();
  const alertSettings = storage.getSettings().stockAlerts;

  // If alerts are disabled, banner disabled, dismissed, or 0 low items
  if (!stats.isEnabled || !stats.notifyInDashboardBanner || dismissed || stats.totalCount === 0) {
    return null;
  }

  const hasOutOfStock = stats.outOfStockCount > 0;
  const hasCritical = stats.criticalCount > 0;

  const handleQuickRestock = (item: Item & { threshold: number }) => {
    setRestockingId(item.id);
    const reorderQty = alertSettings?.autoSuggestReorderQty || 5;
    try {
      const ok = storage.quickRestockItem(item.id, reorderQty);
      if (ok) {
        showToast(`Replenished +${reorderQty} units for ${item.brand} ${item.model}!`, 'success');
      }
    } catch (e: any) {
      showToast(`Restock failed: ${e.message}`, 'error');
    } finally {
      setRestockingId(null);
    }
  };

  const handleWhatsAppSupplier = (item: Item & { threshold: number }) => {
    const shopSettings = storage.getSettings();
    const supplierPhone = item.supplierId
      ? storage.getDatabase().parties.find(p => p.id === item.supplierId)?.mobile || '03001234567'
      : '03001234567';
    const supplierName = item.supplierName || 'Distributor';
    const suggestedQty = alertSettings?.autoSuggestReorderQty || 5;

    const message = `Assalam-o-Alaikum ${supplierName},\n\nThis is ${shopSettings.businessName} (${shopSettings.city}).\nOur stock for ${item.brand} ${item.model} (${item.color}, ${item.storage}) has reached low threshold (Current: ${item.currentStock} units).\n\nKindly confirm availability and best invoice rate for ${suggestedQty} units.\n\nThank you!`;

    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;

    showToast(`WhatsApp restock inquiry prepared for ${item.brand} ${item.model}`, 'success');
    window.open(url, '_blank');
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl ${
      hasOutOfStock
        ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border-rose-500/40 shadow-rose-950/30'
        : 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-amber-950/30'
    }`}>
      {/* Top Main Banner Bar */}
      <div className="p-4 md:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Badge & Descriptions */}
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 relative ${
            hasOutOfStock
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${hasOutOfStock ? 'animate-pulse' : ''}`} />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
              hasOutOfStock ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
            }`} />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                hasOutOfStock
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {hasOutOfStock ? 'URGENT INVENTORY ALERT' : 'STOCK QUANTITY ALERT'}
              </span>

              <h2 className="font-extrabold text-sm md:text-base text-slate-100">
                {stats.totalCount} product{stats.totalCount > 1 ? 's have' : ' has'} reached low inventory threshold
              </h2>
            </div>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Threshold configured in settings:{' '}
                <strong className="text-amber-400 font-mono font-bold">≤ {stats.defaultThreshold} units</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              {hasOutOfStock && (
                <span className="text-rose-400 font-semibold">
                  {stats.outOfStockCount} Out of Stock
                </span>
              )}
              {hasCritical && (
                <span className="text-amber-300 font-medium">
                  {stats.criticalCount} Critical
                </span>
              )}
              {stats.warningCount > 0 && (
                <span className="text-amber-400/90 font-medium">
                  {stats.warningCount} Low Stock
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
            title="Configure inventory thresholds in settings"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Alert Settings</span>
            <span className="sm:hidden">Settings</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('purchases')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 ${
              hasOutOfStock
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Reorder Stock</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            title="Toggle item details list"
          >
            <span>{isExpanded ? 'Hide' : 'Review Items'} ({stats.totalCount})</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Item Detail List */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-semibold text-slate-300">
              Low Stock Items Requiring Restock (Threshold: ≤ {stats.defaultThreshold} units or Custom)
            </span>
            <span>
              Restock Valuation Estimate: <strong className="text-emerald-400 font-mono">₨ {stats.totalRestockCost.toLocaleString()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stats.items.map(item => {
              const reorderQty = alertSettings?.autoSuggestReorderQty || 5;
              const isRestocking = restockingId === item.id;
              const pct = Math.min(100, Math.round((item.currentStock / Math.max(1, item.threshold)) * 100));

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    item.isOut
                      ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500/60'
                      : item.isCritical
                      ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <span>{item.brand} {item.model}</span>
                        {item.isOut ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-rose-500 text-white uppercase">
                            0 Stock
                          </span>
                        ) : item.isCritical ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                            Critical
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-yellow-500/20 text-yellow-300">
                            Low
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.color} • {item.storage} • Cost: ₨ {item.purchasePrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-black font-mono">
                        <span className={item.isOut ? 'text-rose-400 font-extrabold' : item.isCritical ? 'text-amber-400' : 'text-yellow-400'}>
                          {item.currentStock}
                        </span>
                        <span className="text-slate-500"> / {item.threshold} min</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block">threshold</span>
                    </div>
                  </div>

                  {/* Stock Level Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.isOut ? 'bg-rose-500 w-0' : item.isCritical ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Action Buttons for this item */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onOpenItemThresholdModal(item)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                      title="Adjust threshold for this item"
                    >
                      <Sliders className="w-3 h-3 text-slate-400" />
                      <span>Threshold ({item.threshold})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppSupplier(item)}
                        className="p-1.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/30 rounded-lg transition-colors"
                        title="Send WhatsApp message to supplier asking for restock"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={isRestocking}
                        onClick={() => handleQuickRestock(item)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 text-[10px]"
                        title={`Quick restock +${reorderQty} units into inventory`}
                      >
                        {isRestocking ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        <span>+{reorderQty} Restock</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
