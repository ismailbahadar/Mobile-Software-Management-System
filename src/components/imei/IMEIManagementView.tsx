import React, { useState } from 'react';
import { Binary, Search, Plus, Filter, Clock, CheckCircle2, User, Truck, Download } from 'lucide-react';
import { IMEIRecord, IMEIStatus } from '../../types';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';
import { useToast } from '../common/Toast';

export const IMEIManagementView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const imeis = db.imeis;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedImei, setSelectedImei] = useState<IMEIRecord | null>(null);

  // Quick Register Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newImei1, setNewImei1] = useState('');
  const [newImei2, setNewImei2] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [costPrice, setCostPrice] = useState(45000);

  const filtered = imeis.filter(im => {
    const matchSearch =
      im.imei1.includes(search) ||
      (im.imei2 && im.imei2.includes(search)) ||
      (im.serialNumber && im.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      im.model.toLowerCase().includes(search.toLowerCase()) ||
      im.brand.toLowerCase().includes(search.toLowerCase()) ||
      (im.customerName && im.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (im.supplierName && im.supplierName.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'All' || im.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const inStockCount = imeis.filter(i => i.status === 'In Stock').length;
  const soldCount = imeis.filter(i => i.status === 'Sold').length;
  const installmentCount = imeis.filter(i => i.status === 'Installment Active').length;

  const handleRegisterIMEI = (e: React.FormEvent) => {
    e.preventDefault();
    const item = db.items.find(i => i.id === selectedItemId);
    if (!item) {
      showToast('Select a product', 'error');
      return;
    }
    if (!newImei1 || newImei1.trim().length < 10) {
      showToast('IMEI 1 must be at least 10-15 digits', 'error');
      return;
    }

    try {
      const imeiRec = storage.addIMEIRecord({
        itemId: item.id,
        brand: item.brand,
        model: item.model,
        color: item.color,
        storage: item.storage,
        ptaStatus: item.ptaStatus,
        imei1: newImei1.trim(),
        imei2: newImei2.trim(),
        serialNumber: newSerial.trim(),
        purchaseCost: costPrice,
      });

      showToast(`IMEI ${imeiRec.imei1} registered successfully into stock!`, 'success');
      setShowAddModal(false);
      setNewImei1('');
      setNewImei2('');
      setNewSerial('');
    } catch (err: any) {
      showToast(err.message || 'Error registering IMEI', 'error');
    }
  };

  const handleExportCSV = () => {
    const rows = filtered.map(i => ({
      'IMEI 1': i.imei1,
      'IMEI 2': i.imei2 || '',
      'Serial Number': i.serialNumber || '',
      'Brand': i.brand,
      'Model': i.model,
      'Color': i.color,
      'Status': i.status,
      'Purchase Invoice': i.purchaseInvoiceNo || '',
      'Supplier': i.supplierName || '',
      'Purchase Cost': i.purchaseCost,
      'Sale Invoice': i.saleInvoiceNo || '',
      'Customer': i.customerName || '',
      'Sale Price': i.salePrice || '',
      'Contract #': i.installmentContractNo || '',
    }));
    ExportService.exportToCSV('imei_inventory_registry', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>IMEI Lifecycle Management & Tracking</span>
          </h2>
          <p className="text-xs text-slate-400">
            End-to-end device audit trail: Intake → Supplier → Sale / Installment → Complete History
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export IMEI CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Register New IMEI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total IMEIs in System</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">{imeis.length}</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Available In Stock</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">{inStockCount}</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-indigo-400 block font-semibold">Installment Active</span>
          <span className="text-lg font-extrabold text-indigo-400 font-mono">{installmentCount}</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Cash Sold Out</span>
          <span className="text-lg font-extrabold text-slate-300 font-mono">{soldCount}</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search 15-digit IMEI, Brand, Model, Customer, Supplier..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">IMEI Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Sold">Sold</option>
            <option value="Installment Active">Installment Active</option>
            <option value="Installment Completed">Installment Completed</option>
            <option value="Warranty">Warranty Claim</option>
            <option value="Returned">Returned</option>
          </select>
        </div>
      </div>

      {/* IMEI Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">IMEI 1 & 2</th>
                <th className="py-3 px-4">Mobile Model</th>
                <th className="py-3 px-4">PTA & Warranty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Intake (Supplier / Cost)</th>
                <th className="py-3 px-4">Exit (Customer / Bill)</th>
                <th className="py-3 px-4 text-center">Lifecycle History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No IMEI records found matching query.
                  </td>
                </tr>
              ) : (
                filtered.map(im => (
                  <tr key={im.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      <div>{im.imei1}</div>
                      {im.imei2 && <div className="text-[10px] text-slate-400">{im.imei2}</div>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div>{im.brand} {im.model}</div>
                      <div className="text-[10px] text-slate-400">{im.color} {im.storage}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {im.ptaStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          im.status === 'In Stock'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : im.status === 'Installment Active'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : im.status === 'Sold'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {im.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{im.supplierName || 'Direct Stock'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cost: ₨ {im.purchaseCost.toLocaleString()} ({im.purchaseInvoiceNo || '-'})
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {im.customerName ? (
                        <div>
                          <div className="font-semibold text-slate-200">{im.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {im.saleInvoiceNo || im.installmentContractNo} • ₨ {im.salePrice?.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not sold yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedImei(im)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Clock className="w-3 h-3" />
                        <span>View Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Modal */}
      {selectedImei && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  <span>IMEI Audit Timeline: {selectedImei.imei1}</span>
                </h3>
                <p className="text-xs text-slate-400">{selectedImei.brand} {selectedImei.model} ({selectedImei.color})</p>
              </div>
              <button onClick={() => setSelectedImei(null)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 text-xs">
              {/* Device Purchase & Sale Summary */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Purchase Info:</span>
                  <span className="font-mono">{selectedImei.purchaseInvoiceNo || 'Manual Stock'} ({selectedImei.supplierName || 'Vendor'})</span>
                </div>
                {selectedImei.customerName && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Sold To:</span>
                    <span className="font-bold text-slate-200">{selectedImei.customerName} (Bill: {selectedImei.saleInvoiceNo || 'N/A'})</span>
                  </div>
                )}
                {selectedImei.installmentContractNo && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Installment Contract:</span>
                    <span className="font-bold font-mono">{selectedImei.installmentContractNo}</span>
                  </div>
                )}
              </div>

              {/* Complete Repair History against this IMEI (Section O) */}
              {(() => {
                const imeiRepairs = (db.repairs || []).filter(r => 
                  (selectedImei.imei1 && (r.imei1 === selectedImei.imei1 || r.imei2 === selectedImei.imei1)) ||
                  (selectedImei.imei2 && (r.imei1 === selectedImei.imei2 || r.imei2 === selectedImei.imei2))
                );

                if (imeiRepairs.length === 0) return null;

                return (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                      <span>Device Repair Service History ({imeiRepairs.length})</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Linked IMEI Repairs</span>
                    </div>

                    <div className="space-y-2">
                      {imeiRepairs.map(rep => (
                        <div key={rep.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-cyan-400">{rep.repairNo}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rep.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {rep.status}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            <strong>Complaint:</strong> {rep.customerComplaint}
                          </div>
                          {rep.partsUsed.length > 0 && (
                            <div className="text-slate-400">
                              <strong>Parts Replaced:</strong> {rep.partsUsed.map(p => p.partName).join(', ')}
                            </div>
                          )}
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                            <span>Tech: {rep.assignedTechnicianName || 'In-house'}</span>
                            <span>Warranty: {rep.warranty?.duration} {rep.warranty?.expiryDate ? `(Till ${rep.warranty.expiryDate})` : ''}</span>
                            <span className="font-mono font-bold text-slate-300">₨ {rep.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Status Audit Logs */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                  IMEI Lifecycle Trace:
                </span>
                <div className="space-y-3">
                  {selectedImei.history.map((h, idx) => (
                    <div key={idx} className="relative pl-6 pb-3 border-l-2 border-slate-700 last:border-transparent">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900" />
                      <div className="text-xs font-bold text-slate-200">{h.action}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{h.note}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{h.date} • By: {h.user}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedImei(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register IMEI Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Register New In-Stock IMEI</h3>
            <form onSubmit={handleRegisterIMEI} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Phone Model *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={e => {
                    setSelectedItemId(e.target.value);
                    const it = db.items.find(i => i.id === e.target.value);
                    if (it) setCostPrice(it.purchasePrice);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Mobile --</option>
                  {db.items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.brand} {i.model} ({i.color})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IMEI 1 (15 digits) *</label>
                <input
                  type="text"
                  required
                  value={newImei1}
                  onChange={e => setNewImei1(e.target.value)}
                  placeholder="e.g. 861234050198231"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IMEI 2 (Optional)</label>
                <input
                  type="text"
                  value={newImei2}
                  onChange={e => setNewImei2(e.target.value)}
                  placeholder="e.g. 861234050198232"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Serial Number (Optional)</label>
                <input
                  type="text"
                  value={newSerial}
                  onChange={e => setNewSerial(e.target.value)}
                  placeholder="e.g. RF8N10A2B3C"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Purchase Cost (₨)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
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
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
                >
                  Register IMEI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
