import React, { useState } from 'react';
import { ShieldCheck, Plus, User as UserIcon, Check, Lock, Key, Shield } from 'lucide-react';
import { User, UserRole } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

export const UsersAndSecurityView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const users = db.users;
  const auditLogs = db.auditLogs;

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Cashier');
  const [pin, setPin] = useState('1234');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      showToast('Name and username are required', 'error');
      return;
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name,
      username: username.toLowerCase().trim(),
      email,
      phone,
      role,
      active: true,
      pin,
      permissions: {
        viewSales: true,
        createSales: true,
        editSales: role === 'Admin' || role === 'Manager',
        deleteSales: role === 'Admin',
        viewPurchases: role !== 'Cashier',
        createPurchases: role === 'Admin' || role === 'Manager' || role === 'Purchase User',
        viewInventory: true,
        manageInventory: role === 'Admin' || role === 'Manager',
        viewInstallments: true,
        manageInstallments: role !== 'Purchase User',
        viewParties: true,
        manageParties: role === 'Admin' || role === 'Manager',
        viewExpenses: true,
        manageExpenses: role !== 'Salesman',
        viewReports: role === 'Admin' || role === 'Manager' || role === 'Accountant',
        viewProfit: role === 'Admin',
        manageSettings: role === 'Admin',
        exportData: role === 'Admin' || role === 'Manager',
        sendWhatsApp: true,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.users.push(newUser);
    storage.logAudit('CREATE_USER', 'Security', newUser.id, `Created user account: ${newUser.name} (${newUser.role})`);
    showToast(`User ${newUser.name} created!`, 'success');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Users, Roles & Security Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Role-based access control (RBAC), multi-user logins, and tamper-resistant activity logs
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Staff Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'audit' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => (
            <div
              key={u.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{u.name}</h3>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {u.role}
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mobile Phone:</span>
                  <span>{u.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Login PIN:</span>
                  <span className="font-mono text-emerald-400">•••• ({u.pin})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-semibold">{u.active ? 'Active' : 'Disabled'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex flex-wrap gap-1">
                {u.permissions.viewProfit && <span className="bg-slate-800 px-1.5 py-0.5 rounded">View Profit</span>}
                {u.permissions.editSales && <span className="bg-slate-800 px-1.5 py-0.5 rounded">Edit Sales</span>}
                {u.permissions.manageSettings && <span className="bg-slate-800 px-1.5 py-0.5 rounded">Full Admin</span>}
                {u.permissions.manageInstallments && <span className="bg-slate-800 px-1.5 py-0.5 rounded">Installments</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{log.userName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{log.module}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Create Staff User Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Staff Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kashif Ali"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Username (Login ID) *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. kashif"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Purchase User">Purchase User</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Salesman">Salesman</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0300-0000000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Login PIN (4 digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
