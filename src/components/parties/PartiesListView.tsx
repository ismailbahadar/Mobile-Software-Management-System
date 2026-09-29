import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Phone, FileText, Download, Edit2, User } from 'lucide-react';
import { Party, PartyType } from '../../types';
import { storage } from '../../db/storage';
import { PartyFormModal } from './PartyFormModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import { ExportService } from '../../services/exportService';

export const PartiesListView: React.FC = () => {
  const db = storage.getDatabase();
  const parties = db.parties;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [ledgerParty, setLedgerParty] = useState<Party | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const filtered = parties.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile.includes(search) ||
      (p.cnic && p.cnic.includes(search)) ||
      p.city.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === 'All' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalReceivables = parties
    .filter(p => p.type.includes('Customer'))
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayables = parties
    .filter(p => p.type === 'Supplier')
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const handleExportCSV = () => {
    const rows = filtered.map(p => ({
      'Type': p.type,
      'Name': p.name,
      'Father Name': p.fatherName || '',
      'CNIC': p.cnic || '',
      'Mobile': p.mobile,
      'WhatsApp': p.whatsapp || '',
      'City': p.city,
      'Address': p.address,
      'Current Balance': p.currentBalance,
      'Total Sales': p.totalSales || 0,
      'Total Purchases': p.totalPurchases || 0,
    }));
    ExportService.exportToCSV('parties_directory', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customer & Supplier Party Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Khata ledger tracking, receivables, payables, and credit limits
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              setEditingParty(null);
              setShowFormModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Party</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Parties Registered</span>
          <span className="text-lg font-extrabold text-slate-100 font-mono">{filtered.length}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Retail, Wholesale & Vendors</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">Total Customer Receivables</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            ₨ {totalReceivables.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-rose-400 block font-semibold">Total Supplier Payables</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            ₨ {totalPayables.toLocaleString()}
          </span>
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
            placeholder="Search party name, phone, CNIC, city..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Party Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="All">All Parties</option>
            <option value="Customer">Regular Customer</option>
            <option value="Installment Customer">Installment Customer</option>
            <option value="Wholesale Customer">Wholesale Customer</option>
            <option value="Supplier">Supplier / Importer</option>
          </select>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact & CNIC</th>
                <th className="py-3 px-4">City & Address</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Ledger Statement</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No parties found matching query.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{p.name}</div>
                      {p.fatherName && <div className="text-[10px] text-slate-400">S/O: {p.fatherName}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{p.mobile}</div>
                      {p.cnic && <div className="text-[10px] text-slate-400 font-mono">{p.cnic}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.city}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.address}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={p.currentBalance > 0 ? (p.type === 'Supplier' ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-400'}>
                        ₨ {p.currentBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerParty(p);
                          setShowLedgerModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Khata</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingParty(p);
                          setShowFormModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Party"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PartyFormModal
        party={editingParty}
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
      />

      <PartyLedgerModal
        party={ledgerParty}
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
      />
    </div>
  );
};
