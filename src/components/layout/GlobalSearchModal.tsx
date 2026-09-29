import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Smartphone, Binary, User, Receipt, CalendarCheck, ArrowRight, Wrench } from 'lucide-react';
import { storage } from '../../db/storage';
import { MainTab } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: MainTab) => void;
  onSelectIMEI?: (imei: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectIMEI,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const db = storage.getDatabase();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open if caller handles state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedIMEIs = q.length >= 2 ? db.imeis.filter(i => 
    i.imei1.toLowerCase().includes(q) ||
    (i.imei2 && i.imei2.toLowerCase().includes(q)) ||
    (i.serialNumber && i.serialNumber.toLowerCase().includes(q)) ||
    i.model.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const matchedItems = q.length >= 2 ? db.items.filter(i => 
    i.model.toLowerCase().includes(q) ||
    i.brand.toLowerCase().includes(q) ||
    i.barcode.toLowerCase().includes(q) ||
    i.code.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const matchedParties = q.length >= 2 ? db.parties.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.mobile.toLowerCase().includes(q) ||
    (p.cnic && p.cnic.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchedInvoices = q.length >= 2 ? db.sales.filter(s => 
    s.invoiceNo.toLowerCase().includes(q) ||
    s.customerName.toLowerCase().includes(q) ||
    s.customerPhone.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const matchedContracts = q.length >= 2 ? db.installments.filter(c => 
    c.contractNo.toLowerCase().includes(q) ||
    c.customerName.toLowerCase().includes(q) ||
    c.customerCnic.toLowerCase().includes(q) ||
    c.imei1.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const matchedRepairs = q.length >= 2 ? (db.repairs || []).filter(r => 
    r.repairNo.toLowerCase().includes(q) ||
    r.customerName.toLowerCase().includes(q) ||
    r.customerPhone.toLowerCase().includes(q) ||
    (r.imei1 && r.imei1.toLowerCase().includes(q)) ||
    r.model.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const totalResults = matchedIMEIs.length + matchedItems.length + matchedParties.length + matchedInvoices.length + matchedContracts.length + matchedRepairs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by IMEI (15 digits), Model, Customer Phone, CNIC, Invoice #..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {q.length < 2 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-slate-400 text-sm font-medium">Type at least 2 characters to search across everything.</p>
              <div className="flex justify-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-800/80 px-2 py-1 rounded">IMEI</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">Samsung / Apple</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">0300-1234567</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">INV-2026-</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">INST-2026-</span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No records found matching "{query}".
            </div>
          ) : (
            <>
              {/* IMEIs */}
              {matchedIMEIs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Binary className="w-3.5 h-3.5 text-cyan-400" />
                    <span>IMEI Records ({matchedIMEIs.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedIMEIs.map(im => (
                      <div
                        key={im.id}
                        onClick={() => {
                          onClose();
                          if (onSelectIMEI) onSelectIMEI(im.imei1);
                          onNavigate('imei');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
                            <span>{im.imei1}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              im.status === 'In Stock'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : im.status === 'Installment Active'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {im.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {im.brand} {im.model} • {im.color} • Cost: ₨ {im.purchaseCost.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              {matchedItems.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Products & Inventory ({matchedItems.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          onNavigate('inventory');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            {item.brand} {item.model} ({item.ram}/{item.storage})
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Stock: <span className="font-semibold text-emerald-400">{item.currentStock}</span> • Cash: ₨ {item.directPrice.toLocaleString()} • Inst: ₨ {item.installmentPrice.toLocaleString()} • WS: ₨ {item.wholesalePrice.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers & Parties */}
              {matchedParties.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Customers & Suppliers ({matchedParties.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedParties.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onNavigate('parties');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {p.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Phone: {p.mobile} {p.cnic ? `• CNIC: ${p.cnic}` : ''} • Balance: ₨ {p.currentBalance.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Invoices */}
              {matchedInvoices.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sales Invoices ({matchedInvoices.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedInvoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          onClose();
                          onNavigate('sales');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 font-mono">
                            {inv.invoiceNo} — {inv.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {inv.date} • Total: ₨ {inv.grandTotal.toLocaleString()} • Paid: ₨ {inv.paidAmount.toLocaleString()} ({inv.paymentStatus})
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Installment Contracts */}
              {matchedContracts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Installment Contracts ({matchedContracts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedContracts.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onClose();
                          onNavigate('installments');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            {c.contractNo} — {c.customerName} ({c.itemName})
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Remaining: <span className="text-rose-400 font-medium">₨ {c.remainingBalance.toLocaleString()}</span> • Next Due: {c.nextDueDate} (₨ {c.installmentAmount.toLocaleString()})
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Repair Jobs */}
              {matchedRepairs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Repair Service Tickets ({matchedRepairs.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedRepairs.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onClose();
                          onNavigate('repairs');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 font-mono flex items-center gap-2">
                            <span>{r.repairNo}</span>
                            <span className="text-cyan-400 font-sans font-medium">{r.brand} {r.model}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-normal">
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Customer: {r.customerName} ({r.customerPhone}) • Total: ₨ {r.grandTotal.toLocaleString()} • Balance: ₨ {r.remainingAmount.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
