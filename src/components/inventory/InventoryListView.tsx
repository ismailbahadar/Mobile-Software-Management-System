import React, { useState } from 'react';
import {
  Smartphone, Plus, Search, Filter, Edit2, Trash2, Download,
  AlertTriangle, CheckCircle2, Barcode as BarcodeIcon, DollarSign,
  Sliders, Bell
} from 'lucide-react';
import { Item } from '../../types';
import { storage } from '../../db/storage';
import { ItemFormModal } from './ItemFormModal';
import { InventorySettingsModal } from './InventorySettingsModal';
import { ItemThresholdModal } from './ItemThresholdModal';
import { ExportService } from '../../services/exportService';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useToast } from '../common/Toast';

export const InventoryListView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const items = db.items;
  const alertStats = storage.getStockAlertStats();

  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [itemForThreshold, setItemForThreshold] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const brands = ['All', ...Array.from(new Set(items.map(i => i.brand)))];
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filtered = items.filter(item => {
    const matchSearch =
      item.model.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search);

    const matchBrand = selectedBrand === 'All' || item.brand === selectedBrand;
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    
    const threshold = storage.getItemThreshold(item);
    let matchStock = true;
    if (stockFilter === 'low') matchStock = item.currentStock <= threshold && item.currentStock > 0;
    else if (stockFilter === 'out') matchStock = item.currentStock === 0;
    else if (stockFilter === 'alert') matchStock = item.currentStock <= threshold;
    else if (stockFilter === 'in') matchStock = item.currentStock > 0;

    return matchSearch && matchBrand && matchCat && matchStock;
  });

  const totalStockQuantity = filtered.reduce((sum, i) => sum + i.currentStock, 0);
  const totalCostValuation = filtered.reduce((sum, i) => sum + (i.currentStock * i.purchasePrice), 0);
  const totalRetailValuation = filtered.reduce((sum, i) => sum + (i.currentStock * i.directPrice), 0);
  const totalInstallmentValuation = filtered.reduce((sum, i) => sum + (i.currentStock * i.installmentPrice), 0);

  const handleExportCSV = () => {
    const rows = filtered.map(i => ({
      'Code': i.code,
      'Barcode': i.barcode,
      'Brand': i.brand,
      'Model': i.model,
      'Color': i.color,
      'RAM': i.ram,
      'Storage': i.storage,
      'PTA Status': i.ptaStatus,
      'Current Stock': i.currentStock,
      'Alert Threshold': storage.getItemThreshold(i),
      'Cost Price': i.purchasePrice,
      'Direct Price': i.directPrice,
      'Installment Price': i.installmentPrice,
      'Wholesale Price': i.wholesalePrice,
      'Warranty': i.warranty,
    }));
    ExportService.exportToCSV('inventory_stock', rows);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      const ok = storage.deleteItem(itemToDelete.id);
      if (ok) {
        showToast(`Item ${itemToDelete.brand} ${itemToDelete.model} deleted`, 'info');
      }
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Items & Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stock tracking with 3 distinct price tiers (Direct, Installment & Wholesale)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold shadow-sm transition-all"
            title="Configure Low Stock Alert Thresholds in Inventory Settings"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Alert Thresholds</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300">
              ≤{alertStats.defaultThreshold}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setShowFormModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Valuation & Alert Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Units in Stock</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">
            {totalStockQuantity.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{filtered.length} products</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-amber-400 block font-semibold">Stock Cost Value</span>
          <span className="text-lg font-extrabold text-amber-400 font-mono">
            ₨ {totalCostValuation.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Direct Cash Value</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            ₨ {totalRetailValuation.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-indigo-400 block font-semibold">Installment Value</span>
          <span className="text-lg font-extrabold text-indigo-400 font-mono">
            ₨ {totalInstallmentValuation.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stock Alerts</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">≤{alertStats.defaultThreshold} units</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-amber-300 font-mono">
              {alertStats.totalCount}
            </span>
            <span className="text-[10px] text-slate-400">
              ({alertStats.outOfStockCount} Out, {alertStats.criticalCount} Crit)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by brand, model, barcode, code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Brand:</span>
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Stock:</span>
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Items</option>
            <option value="alert">⚠️ All Low Stock / Alerts ({alertStats.totalCount})</option>
            <option value="low">Low Stock Only (Above 0)</option>
            <option value="out">Out of Stock (0 units)</option>
            <option value="in">Available in Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Item & Specifications</th>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4">PTA & Warranty</th>
                <th className="py-3 px-4 text-center">Stock & Alert</th>
                <th className="py-3 px-4 text-right">Cost (₨)</th>
                <th className="py-3 px-4 text-right text-emerald-400">Direct / Cash</th>
                <th className="py-3 px-4 text-right text-indigo-400">Installment</th>
                <th className="py-3 px-4 text-right text-amber-400">Wholesale</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const threshold = storage.getItemThreshold(item);
                  const isOutOfStock = item.currentStock === 0;
                  const isLow = item.currentStock <= threshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{item.brand} {item.model}</span>
                          {isOutOfStock && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-rose-500 text-white">
                              0 Stock
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.color} • {item.ram && `${item.ram}/`}{item.storage}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>{item.code}</div>
                        <div className="text-[10px] text-slate-500">{item.barcode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {item.ptaStatus}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{item.warranty}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            min: {threshold}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                        ₨ {item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₨ {item.directPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">
                        ₨ {item.installmentPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                        ₨ {item.wholesalePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setItemForThreshold(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Adjust Alert Threshold"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setShowFormModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemFormModal
        item={editingItem}
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
      />

      <InventorySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <ItemThresholdModal
        item={itemForThreshold}
        isOpen={!!itemForThreshold}
        onClose={() => setItemForThreshold(null)}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        title="Delete Item"
        message={`Are you sure you want to delete ${itemToDelete?.brand} ${itemToDelete?.model}? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

