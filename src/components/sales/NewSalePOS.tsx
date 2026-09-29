import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Barcode, Trash2, Plus, Minus, User, Phone, Check,
  Printer, Share2, FileText, RotateCcw, AlertTriangle, ShieldCheck,
  CreditCard, Smartphone
} from 'lucide-react';
import { Item, IMEIRecord, Party, SaleItem, SaleType, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { SaleInvoiceModal } from './SaleInvoiceModal';

interface NewSalePOSProps {
  onSaleCompleted?: () => void;
}

export const NewSalePOS: React.FC<NewSalePOSProps> = ({ onSaleCompleted }) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('Cash');

  // Customer
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('0300-0000000');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Payment
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');

  // Post-sale invoice modal
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Auto-focus barcode input
  const barcodeRef = useRef<HTMLInputElement>(null);

  const brands = ['All', ...Array.from(new Set(db.items.map(i => i.brand)))];
  const categories = ['All', ...Array.from(new Set(db.items.map(i => i.category)))];

  const filteredItems = db.items.filter(item => {
    if (!item.active) return false;
    const matchQuery =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBrand = selectedBrand === 'All' || item.brand === selectedBrand;
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchQuery && matchBrand && matchCat;
  });

  // Calculate pricing based on current saleType
  const getUnitPriceForTier = (item: Item, tier: SaleType): number => {
    if (tier === 'Wholesale') return item.wholesalePrice;
    if (tier === 'Installment') return item.installmentPrice;
    return item.directPrice;
  };

  const handleAddToCart = (item: Item) => {
    if (item.currentStock <= 0) {
      showToast(`${item.brand} ${item.model} is out of stock!`, 'error');
      return;
    }

    const availableImeis = storage.getAvailableIMEIsForItem(item.id);
    const existingIndex = cart.findIndex(c => c.itemId === item.id);

    // If item has available IMEIs, we assign the first available unassigned IMEI
    const assignedImeis = cart.map(c => c.imei1).filter(Boolean);
    const freeImei = availableImeis.find(im => !assignedImeis.includes(im.imei1));

    const unitPrice = getUnitPriceForTier(item, saleType);
    const cost = item.purchasePrice;

    if (existingIndex > -1 && (!availableImeis.length || !freeImei)) {
      // Increase qty if not IMEI restricted or general accessory
      const updated = [...cart];
      if (updated[existingIndex].quantity + 1 > item.currentStock) {
        showToast(`Stock limit reached for ${item.model}`, 'error');
        return;
      }
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      updated[existingIndex].profit = (updated[existingIndex].unitPrice - updated[existingIndex].purchaseCost) * updated[existingIndex].quantity;
      setCart(updated);
    } else {
      // Add new cart row
      const newCartItem: SaleItem = {
        id: 'ci-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        itemId: item.id,
        itemName: `${item.brand} ${item.model}`,
        brand: item.brand,
        model: item.model,
        color: item.color,
        storage: item.storage,
        imei1: freeImei?.imei1,
        imei2: freeImei?.imei2,
        imeiId: freeImei?.id,
        quantity: 1,
        purchaseCost: cost,
        unitPrice,
        saleType,
        discount: 0,
        tax: 0,
        total: unitPrice,
        profit: unitPrice - cost,
      };
      setCart(prev => [newCartItem, ...prev]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Check if input matches an IMEI directly!
    const imeiRec = storage.getIMEIByNumber(barcodeInput.trim());
    if (imeiRec) {
      if (imeiRec.status !== 'In Stock') {
        showToast(`IMEI ${imeiRec.imei1} is currently ${imeiRec.status}!`, 'error');
        setBarcodeInput('');
        return;
      }
      const item = storage.getItemById(imeiRec.itemId);
      if (item) {
        const unitPrice = getUnitPriceForTier(item, saleType);
        const newCartItem: SaleItem = {
          id: 'ci-' + Date.now(),
          itemId: item.id,
          itemName: `${item.brand} ${item.model}`,
          brand: item.brand,
          model: item.model,
          color: imeiRec.color || item.color,
          storage: imeiRec.storage || item.storage,
          imei1: imeiRec.imei1,
          imei2: imeiRec.imei2,
          imeiId: imeiRec.id,
          quantity: 1,
          purchaseCost: imeiRec.purchaseCost || item.purchasePrice,
          unitPrice,
          saleType,
          discount: 0,
          tax: 0,
          total: unitPrice,
          profit: unitPrice - (imeiRec.purchaseCost || item.purchasePrice),
        };
        setCart(prev => [newCartItem, ...prev]);
        showToast(`Scanned IMEI: ${imeiRec.imei1} (${item.model})`, 'success');
        setBarcodeInput('');
        return;
      }
    }

    // Check item barcode
    const item = db.items.find(i => i.barcode === barcodeInput.trim() || i.code === barcodeInput.trim());
    if (item) {
      handleAddToCart(item);
      setBarcodeInput('');
    } else {
      showToast(`No item or IMEI matched "${barcodeInput}"`, 'error');
      setBarcodeInput('');
    }
  };

  const handleUpdatePriceTier = (newTier: SaleType) => {
    setSaleType(newTier);
    setCart(prev => prev.map(c => {
      const item = storage.getItemById(c.itemId);
      if (!item) return c;
      const newPrice = getUnitPriceForTier(item, newTier);
      return {
        ...c,
        saleType: newTier,
        unitPrice: newPrice,
        total: newPrice * c.quantity,
        profit: (newPrice - c.purchaseCost) * c.quantity,
      };
    }));
  };

  const handleSelectCustomer = (p: Party) => {
    setSelectedParty(p);
    setCustomerName(p.name);
    setCustomerPhone(p.mobile);
    setCustomerCnic(p.cnic || '');
    setCustomerAddress(p.address || '');
    if (p.type === 'Wholesale Customer') {
      handleUpdatePriceTier('Wholesale');
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateImei = (cartIndex: number, newImei1: string) => {
    const imeiRec = storage.getIMEIByNumber(newImei1);
    if (!imeiRec) return;
    const updated = [...cart];
    updated[cartIndex].imei1 = imeiRec.imei1;
    updated[cartIndex].imei2 = imeiRec.imei2;
    updated[cartIndex].imeiId = imeiRec.id;
    if (imeiRec.purchaseCost) {
      updated[cartIndex].purchaseCost = imeiRec.purchaseCost;
      updated[cartIndex].profit = (updated[cartIndex].unitPrice - imeiRec.purchaseCost) * updated[cartIndex].quantity;
    }
    setCart(updated);
  };

  const subtotal = cart.reduce((sum, it) => sum + it.total, 0);
  const grandTotal = Math.max(0, subtotal - discount + tax);
  const balance = Math.max(0, grandTotal - paidAmount);

  // Set default paidAmount when total changes unless credit customer
  useEffect(() => {
    if (selectedParty?.type === 'Wholesale Customer' && saleType === 'Credit') {
      setPaidAmount(0);
    } else {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal, saleType, selectedParty]);

  const handleClear = () => {
    if (cart.length > 0 && !window.confirm('Clear current sale items?')) return;
    setCart([]);
    setSelectedParty(null);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('0300-0000000');
    setCustomerCnic('');
    setCustomerAddress('');
    setDiscount(0);
    setTax(0);
    setNotes('');
  };

  const handleSaveSale = (printAfter: boolean = false, whatsappAfter: boolean = false) => {
    if (cart.length === 0) {
      showToast('Cart is empty. Add at least one product!', 'error');
      return;
    }

    try {
      const invoice = storage.createSale({
        customer: selectedParty || {
          name: customerName,
          mobile: customerPhone,
          cnic: customerCnic,
          address: customerAddress,
        },
        items: cart,
        discount,
        tax,
        paidAmount,
        paymentMethod,
        saleType,
        notes,
      });

      showToast(`Sale Invoice ${invoice.invoiceNo} saved successfully!`, 'success');
      setLastInvoice(invoice);
      setShowInvoiceModal(true);
      handleClear();
      if (onSaleCompleted) onSaleCompleted();
    } catch (e: any) {
      showToast(e.message || 'Error completing sale', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* LEFT COLUMN: ITEM CATALOGUE & BARCODE SCANNER */}
      <div className="w-full lg:w-[35%] xl:w-[32%] flex flex-col border-r border-slate-800 bg-slate-900/60 shrink-0">
        {/* Barcode & Search Controls */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/60">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode or Type IMEI + Enter..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </form>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Brand, Model, Spec..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {brands.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBrand(b)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                  selectedBrand === b
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No matching products found.
            </div>
          ) : (
            filteredItems.map(item => {
              const currentTierPrice = getUnitPriceForTier(item, saleType);
              const inStock = item.currentStock > 0;
              return (
                <div
                  key={item.id}
                  onClick={() => inStock && handleAddToCart(item)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    inStock
                      ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 hover:border-emerald-500/50 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-900/30 border-slate-800/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        {item.brand} {item.model}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.color} • {item.ram && `${item.ram}/`}{item.storage} • {item.ptaStatus}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        inStock
                          ? item.currentStock <= item.reorderLevel
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {inStock ? `${item.currentStock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[11px]">
                    <span className="text-slate-400">
                      {saleType} Price:
                    </span>
                    <span className="font-extrabold text-emerald-400 font-mono text-xs">
                      ₨ {currentTierPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER COLUMN: CART & IMEI SELECTION */}
      <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/40">
        {/* Tier Price Switcher Toolbar */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sale Tier:</span>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              {(['Cash', 'Wholesale', 'Installment'] as SaleType[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdatePriceTier(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    saleType === st
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Items in Cart: <span className="font-bold text-emerald-400">{cart.length}</span>
          </div>
        </div>

        {/* Cart Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Smartphone className="w-12 h-12 stroke-[1.2] text-slate-600" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">
                Scan barcode, enter IMEI or click products from the left catalogue to add them to sale.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const availableImeis = storage.getAvailableIMEIsForItem(item.itemId);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{item.itemName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {item.saleType}
                      </span>
                    </div>

                    {/* IMEI Selector dropdown if applicable */}
                    {availableImeis.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">IMEI:</span>
                        <select
                          value={item.imei1 || ''}
                          onChange={e => handleUpdateImei(idx, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-300 focus:outline-none"
                        >
                          <option value="">-- Assign In-Stock IMEI --</option>
                          {availableImeis.map(im => (
                            <option key={im.id} value={im.imei1}>
                              {im.imei1} ({im.color})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Qty */}
                    <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[10px]">Qty:</span>
                      <span className="font-bold text-slate-100">{item.quantity}</span>
                    </div>

                    {/* Unit Price */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Unit Price</div>
                      <div className="font-mono font-bold text-slate-200">
                        ₨ {item.unitPrice.toLocaleString()}
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="text-right min-w-[90px]">
                      <div className="text-[10px] text-slate-400">Total</div>
                      <div className="font-mono font-extrabold text-emerald-400 text-sm">
                        ₨ {item.total.toLocaleString()}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CUSTOMER, PAYMENT & SUMMARY */}
      <div className="w-full lg:w-[32%] xl:w-[28%] flex flex-col bg-slate-900/90 shrink-0">
        {/* Customer Header */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Details</span>
            </span>
            {selectedParty && (
              <button
                type="button"
                onClick={() => {
                  setSelectedParty(null);
                  setCustomerName('Walk-in Customer');
                  setCustomerPhone('0300-0000000');
                }}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick select existing customer */}
          {!selectedParty && (
            <select
              onChange={e => {
                const party = db.parties.find(p => p.id === e.target.value);
                if (party) handleSelectCustomer(party);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
            >
              <option value="">-- Choose Existing Party / Wholesale --</option>
              {db.parties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mobile}) [{p.type}]
                </option>
              ))}
            </select>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Mobile Phone"
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Payment Method
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {(['Cash', 'Bank', 'JazzCash', 'Easypaisa', 'Other'] as PaymentMethod[]).map(pm => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                className={`py-1.5 px-2 rounded-lg font-semibold text-center border transition-all ${
                  paymentMethod === pm
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        {/* Calculations & Balance */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono text-slate-200 font-semibold">₨ {subtotal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Discount:</span>
            <div className="w-28 relative">
              <span className="absolute left-2 top-1 text-slate-500 text-[10px]">₨</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-mono text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-slate-100">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-emerald-400">₨ {grandTotal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-slate-400 font-semibold">Paid Amount:</span>
            <div className="w-32 relative">
              <span className="absolute left-2 top-1 text-slate-500 text-[10px]">₨</span>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-1 bg-slate-800 border border-emerald-500/40 rounded text-right font-mono font-bold text-sm text-emerald-300"
              />
            </div>
          </div>

          <div className="flex justify-between text-xs font-bold pt-1">
            <span className="text-slate-400">Remaining Balance:</span>
            <span className={`font-mono ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₨ {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSaveSale(true, false)}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save & Print</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveSale(false, true)}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-950 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Save & WhatsApp</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-all"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleSaveSale(false, false)}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Sale (₨ {grandTotal.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal for Preview, Thermal Printing & WhatsApp */}
      <SaleInvoiceModal
        invoice={lastInvoice}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
