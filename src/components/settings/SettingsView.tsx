import React, { useState } from 'react';
import { Settings, Save, Check, Building, FileText, DollarSign, Percent } from 'lucide-react';
import { storage } from '../../db/storage';
import { ShopSettings, Currency } from '../../types';
import { useToast } from '../common/Toast';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const [form, setForm] = useState<ShopSettings>({ ...db.settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings(form);
    showToast('Shop business profile and settings updated!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Mobile Shop Business & System Settings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure shop branding, NTN/STRN, invoice prefixes, and default currency
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        {/* Business Branding */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Shop Profile & Branding</span>
          </h3>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Business / Shop Name *</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Tagline / Slogan</label>
            <input
              type="text"
              value={form.tagline}
              onChange={e => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Full Shop Address *</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">City / Location</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">NTN / STRN</label>
              <input
                type="text"
                value={form.ntnStrn || ''}
                onChange={e => setForm({ ...form, ntnStrn: e.target.value })}
                placeholder="e.g. NTN: 8492015-3"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Official Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Official WhatsApp</label>
              <input
                type="text"
                value={form.whatsappPhone}
                onChange={e => setForm({ ...form, whatsappPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Currency & Invoicing Prefixes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Currency & Numbering Schemes</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Shop Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value as Currency })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="SAR">SAR (Saudi Riyal)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Currency Symbol</label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={e => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-slate-400 mb-1">Sale Invoice Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={e => setForm({ ...form, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Next Invoice #</label>
              <input
                type="number"
                value={form.nextInvoiceNum}
                onChange={e => setForm({ ...form, nextInvoiceNum: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Installment Contract Prefix</label>
              <input
                type="text"
                value={form.installmentContractPrefix}
                onChange={e => setForm({ ...form, installmentContractPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Next Contract #</label>
              <input
                type="number"
                value={form.nextContractNum}
                onChange={e => setForm({ ...form, nextContractNum: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={form.receiptPrefix}
                onChange={e => setForm({ ...form, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Purchase Order Prefix</label>
              <input
                type="text"
                value={form.poPrefix}
                onChange={e => setForm({ ...form, poPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Inventory Valuation Method</label>
            <select
              value={form.inventoryValuationMethod}
              onChange={e => setForm({ ...form, inventoryValuationMethod: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            >
              <option value="Average Cost">Weighted Average Purchase Cost (Recommended)</option>
              <option value="Last Purchase Cost">Last Purchase Cost</option>
              <option value="FIFO">First-In First-Out (FIFO)</option>
            </select>
          </div>
        </div>

        {/* INVENTORY & STOCK ALERT SETTINGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl lg:col-span-2">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              ⚠️
            </span>
            <span>Inventory Stock Alert & Low Quantity Threshold Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Default Low Stock Alert Threshold (Units) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.stockAlerts?.defaultLowStockThreshold ?? 3}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    defaultLowStockThreshold: Number(e.target.value) || 1,
                  }
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Items with stock quantity equal to or lower than this threshold will trigger dashboard alerts.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Critical Emergency Threshold (Units)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={form.stockAlerts?.criticalStockThreshold ?? 1}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    criticalStockThreshold: Number(e.target.value) || 0,
                  }
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Items at or below this level are highlighted with critical red priority badges.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Auto Suggested Reorder Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={form.stockAlerts?.autoSuggestReorderQty ?? 5}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    autoSuggestReorderQty: Number(e.target.value) || 5,
                  }
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Default suggested quantity when clicking "Reorder Stock" from alert cards.
              </p>
            </div>
          </div>

          {/* Category Specific Thresholds */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold block text-xs">
              Category-Specific Low Stock Threshold Overrides:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Smart Phones', 'Feature Phones', 'Accessories', 'Tablets'].map(cat => (
                <div key={cat} className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1 truncate">{cat}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.stockAlerts?.categoryThresholds?.[cat] ?? form.stockAlerts?.defaultLowStockThreshold ?? 3}
                      onChange={e => setForm({
                        ...form,
                        stockAlerts: {
                          ...form.stockAlerts,
                          categoryThresholds: {
                            ...(form.stockAlerts?.categoryThresholds || {}),
                            [cat]: Math.max(1, Number(e.target.value)),
                          }
                        }
                      })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
                    />
                    <span className="text-[10px] text-slate-400">min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={form.stockAlerts?.enableStockAlerts ?? true}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    enableStockAlerts: e.target.checked,
                  }
                })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span className="font-medium">Enable Global Stock Alert Engine</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={form.stockAlerts?.notifyInDashboardBanner ?? true}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    notifyInDashboardBanner: e.target.checked,
                  }
                })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span>Show Warning Banner on Dashboard</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={form.stockAlerts?.alertOnOutOfStock ?? true}
                onChange={e => setForm({
                  ...form,
                  stockAlerts: {
                    ...form.stockAlerts,
                    alertOnOutOfStock: e.target.checked,
                  }
                })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span>Immediate Alert on Zero / Out of Stock</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
