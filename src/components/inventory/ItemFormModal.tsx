import React, { useState, useEffect } from 'react';
import { X, Check, Smartphone, DollarSign, Tag, ShieldCheck } from 'lucide-react';
import { Item, PTAType } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface ItemFormModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (item: Item) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const suppliers = db.parties.filter(p => p.type === 'Supplier');

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Smart Phones');
  const [subcategory, setSubcategory] = useState('Mid-Range');
  const [color, setColor] = useState('Black');
  const [ram, setRam] = useState('8GB');
  const [storageVal, setStorageVal] = useState('256GB');
  const [ptaStatus, setPtaStatus] = useState<PTAType>('Official Warranty');
  const [warranty, setWarranty] = useState('1 Year Official');
  const [supplierId, setSupplierId] = useState('');

  // 3-Tier Prices + Purchase Cost
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [directPrice, setDirectPrice] = useState<number>(0);
  const [installmentPrice, setInstallmentPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);

  const [minStock, setMinStock] = useState<number>(2);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(1);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setBrand(item.brand);
      setModel(item.model);
      setCode(item.code);
      setBarcode(item.barcode);
      setCategory(item.category);
      setSubcategory(item.subcategory || '');
      setColor(item.color);
      setRam(item.ram || '');
      setStorageVal(item.storage || '');
      setPtaStatus(item.ptaStatus);
      setWarranty(item.warranty);
      setSupplierId(item.supplierId || '');
      setPurchasePrice(item.purchasePrice);
      setDirectPrice(item.directPrice);
      setInstallmentPrice(item.installmentPrice);
      setWholesalePrice(item.wholesalePrice);
      setMinStock(item.minStock);
      setCurrentStock(item.currentStock);
      setReorderLevel(item.reorderLevel);
      setDescription(item.description);
    } else {
      setBrand('');
      setModel('');
      setCode('ITM-' + Date.now().toString().slice(-4));
      setBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
      setCategory('Smart Phones');
      setSubcategory('Mid-Range');
      setColor('Black');
      setRam('8GB');
      setStorageVal('256GB');
      setPtaStatus('Official Warranty');
      setWarranty('1 Year Official');
      setSupplierId(suppliers[0]?.id || '');
      setPurchasePrice(50000);
      setDirectPrice(58000);
      setInstallmentPrice(70000);
      setWholesalePrice(55000);
      setMinStock(2);
      setCurrentStock(0);
      setReorderLevel(1);
      setDescription('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      showToast('Brand and Model are required', 'error');
      return;
    }
    if (directPrice <= 0 || installmentPrice <= 0 || wholesalePrice <= 0) {
      showToast('All 3 selling price tiers (Direct, Installment, Wholesale) must be greater than 0', 'error');
      return;
    }

    const sup = suppliers.find(s => s.id === supplierId);

    const saved = storage.saveItem({
      id: item?.id,
      code,
      barcode,
      brand,
      model,
      category,
      subcategory,
      color,
      ram,
      storage: storageVal,
      ptaStatus,
      warranty,
      supplierId,
      supplierName: sup?.name,
      purchasePrice,
      directPrice,
      installmentPrice,
      wholesalePrice,
      minStock,
      currentStock,
      reorderLevel,
      description,
    });

    showToast(`Product ${saved.brand} ${saved.model} saved successfully!`, 'success');
    if (onSaved) onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              {item ? 'Edit Mobile Product / Spec' : 'Add New Mobile Product'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Brand *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Samsung, Apple, Xiaomi, Infinix"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Model Name *</label>
              <input
                type="text"
                required
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Galaxy A15, iPhone 15 Pro Max"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          {/* Barcode & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Item Code / SKU</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Barcode (EAN-13 / Code128)</label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="Smart Phones">Smart Phones</option>
                <option value="Feature Phones">Feature Phones</option>
                <option value="Tablets">Tablets</option>
                <option value="Audio & Wearables">Audio & Wearables</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="e.g. Natural Titanium"
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">RAM</label>
              <input
                type="text"
                value={ram}
                onChange={e => setRam(e.target.value)}
                placeholder="e.g. 8GB"
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Storage</label>
              <input
                type="text"
                value={storageVal}
                onChange={e => setStorageVal(e.target.value)}
                placeholder="e.g. 256GB"
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          {/* PTA & Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">PTA Approval Status</label>
              <select
                value={ptaStatus}
                onChange={e => setPtaStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold text-emerald-400"
              >
                <option value="Official Warranty">Official Warranty (Airlink/Mercantile/etc.)</option>
                <option value="PTA Approved">PTA Approved (Tax Paid)</option>
                <option value="Non-PTA">Non-PTA (International)</option>
                <option value="JV (Patch)">JV / Patch Allowed</option>
                <option value="N/A">N/A (Accessories)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Warranty Term</label>
              <input
                type="text"
                value={warranty}
                onChange={e => setWarranty(e.target.value)}
                placeholder="e.g. 1 Year Official / 7 Days Checking"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          {/* CRITICAL: 3 SELLING PRICES + PURCHASE COST */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2.5">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>3-Tier Selling Prices & Cost (Required)</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-400 mb-1">Purchase Cost (₨)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1 font-semibold">1. Direct / Cash (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={directPrice}
                  onChange={e => setDirectPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-emerald-500/50 rounded font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-indigo-400 mb-1 font-semibold">2. Installment (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={installmentPrice}
                  onChange={e => setInstallmentPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-indigo-500/50 rounded font-mono font-bold text-indigo-300"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1 font-semibold">3. Wholesale (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={wholesalePrice}
                  onChange={e => setWholesalePrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-amber-500/50 rounded font-mono font-bold text-amber-300"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1">
              <span>Cash Profit: <strong className="text-emerald-400 font-mono">₨ {(directPrice - purchasePrice).toLocaleString()}</strong></span>
              <span>Installment Profit: <strong className="text-indigo-400 font-mono">₨ {(installmentPrice - purchasePrice).toLocaleString()}</strong></span>
              <span>Wholesale Profit: <strong className="text-amber-400 font-mono">₨ {(wholesalePrice - purchasePrice).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Current Stock Qty</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={e => setCurrentStock(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Reorder Level Alert</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={e => setReorderLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Min Safety Stock</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={e => setMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Product Description / Highlights</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 50MP Camera, 5000mAh Battery, AMOLED 90Hz Display"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            />
          </div>

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
              <span>Save Product Specifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
