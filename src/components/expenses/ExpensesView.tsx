import React, { useState } from 'react';
import { DollarSign, Plus, Search, Filter, Trash2, Download } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';
import { useToast } from '../common/Toast';

export const ExpensesView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const expenses = db.expenses;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('Tea/Food');
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  const categories: Array<'All' | ExpenseCategory> = [
    'All', 'Rent', 'Electricity', 'Internet', 'Salaries', 'Transport',
    'Repair', 'Maintenance', 'Tea/Food', 'Advertisement', 'Other'
  ];

  const filtered = expenses.filter(e => {
    const matchSearch =
      e.expenseNo.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(search.toLowerCase()));

    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalExpenseAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    const exp = storage.addExpense({
      category,
      amount,
      paymentMethod,
      description,
      paidTo,
      referenceNo,
    });

    showToast(`Expense ${exp.expenseNo} recorded!`, 'success');
    setShowAddModal(false);
    setDescription('');
    setPaidTo('');
    setReferenceNo('');
  };

  const handleExportCSV = () => {
    const rows = filtered.map(e => ({
      'Expense #': e.expenseNo,
      'Date': e.date,
      'Time': e.time,
      'Category': e.category,
      'Description': e.description,
      'Amount (₨)': e.amount,
      'Payment Method': e.paymentMethod,
      'Paid To': e.paidTo || '',
      'Reference': e.referenceNo || '',
    }));
    ExportService.exportToCSV('shop_expenses', rows);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <span>Operational Expenses Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Record shop overheads, utilities, salaries, and sync with Profit & Loss
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Filtered Expenses</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            ₨ {totalExpenseAmount.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{filtered.length} entries</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Top Expense Category</span>
          <span className="text-base font-bold text-slate-100 mt-1">Electricity & Commercial Rent</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 block font-semibold">P&L Integration</span>
          <span className="text-xs text-slate-300 mt-1 block">
            Auto deducted from Gross Profit to calculate Net Profit
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
            placeholder="Search by expense #, description, payee..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (₨)</th>
                <th className="py-3 px-4">Paid By</th>
                <th className="py-3 px-4">Paid To / Ref</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{e.expenseNo}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{e.date}</div>
                      <div className="text-[10px] text-slate-500">{e.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-rose-300 border border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 max-w-xs">{e.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      ₨ {e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {e.paidTo} {e.referenceNo ? `(${e.referenceNo})` : ''}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete expense ${e.expenseNo}?`)) {
                            storage.deleteExpense(e.id);
                            showToast('Expense removed', 'info');
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Record New Shop Expense</span>
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount (₨) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Shop tea & refreshment / generator fuel"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Easypaisa">Easypaisa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Paid To / Payee</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={e => setPaidTo(e.target.value)}
                    placeholder="e.g. Cafeteria / Landlord"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Receipt / Bill Reference #</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  placeholder="e.g. Bill # 89123"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
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
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
