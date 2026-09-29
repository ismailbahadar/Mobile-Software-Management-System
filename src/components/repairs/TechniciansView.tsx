import React, { useState } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Phone, Award, DollarSign, 
  Wrench, CheckCircle2, Clock, ShieldCheck, Search, Filter, X 
} from 'lucide-react';
import { Technician } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

const ALL_SPECIALIZATIONS = [
  'Software',
  'Hardware',
  'Screen Replacement',
  'Charging',
  'IC Repair',
  'Network',
  'Apple Repair',
  'Android Repair',
  'Water Damage',
  'Motherboard Soldering',
  'Other',
];

export const TechniciansView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const technicians = db.technicians || [];
  const repairs = db.repairs || [];

  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [commissionRate, setCommissionRate] = useState(25);
  const [salary, setSalary] = useState(0);
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingTech(null);
    setName('');
    setPhone('');
    setCnic('');
    setAddress('');
    setSpecializations(['Hardware', 'Screen Replacement']);
    setCommissionRate(25);
    setSalary(0);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Technician) => {
    setEditingTech(t);
    setName(t.name);
    setPhone(t.phone);
    setCnic(t.cnic);
    setAddress(t.address);
    setSpecializations(t.specializations);
    setCommissionRate(t.commissionRate);
    setSalary(t.salary || 0);
    setActive(t.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Technician name is required', 'error');
      return;
    }

    try {
      storage.saveTechnician({
        id: editingTech?.id,
        name: name.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        specializations,
        commissionRate: Number(commissionRate) || 0,
        salary: Number(salary) || 0,
        active,
      });

      showToast(`Technician ${name} saved successfully!`, 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving technician', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove technician ${name}?`)) {
      storage.deleteTechnician(id);
      showToast(`Technician ${name} deleted`, 'info');
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter(s => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  // Filter technicians
  const filteredTechs = technicians.filter(t => {
    const matchSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      (t.cnic && t.cnic.includes(search));
    const matchSpec = filterSpec === 'All' || t.specializations.includes(filterSpec);
    return matchSearch && matchSpec;
  });

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Technicians & Workbench Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Technician assignments, skill specialization, commissions, and repair performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Technician</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by technician name, phone, CNIC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 shrink-0">Specialization:</span>
          <select
            value={filterSpec}
            onChange={e => setFilterSpec(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="All">All Specializations</option>
            {ALL_SPECIALIZATIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTechs.map(t => {
          // Calculate performance stats
          const techJobs = repairs.filter(r => r.assignedTechnicianId === t.id);
          const activeJobs = techJobs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable');
          const completedJobs = techJobs.filter(r => r.status === 'Delivered');
          const totalRevenue = completedJobs.reduce((sum, r) => sum + r.grandTotal, 0);
          const totalCommission = Math.round(completedJobs.reduce((sum, r) => sum + (r.laborCharge * (t.commissionRate / 100)), 0));

          return (
            <div
              key={t.id}
              className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between space-y-3 transition-all ${
                t.active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-950">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {!t.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {t.phone || 'No Phone'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Technician"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Technician"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specializations Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload and Performance Box */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Active Workload</span>
                    <span className={`text-sm font-extrabold font-mono ${activeJobs.length > 3 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {activeJobs.length} Jobs
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Delivered Repairs</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-400">
                      {completedJobs.length} Done
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                  <span>Commission ({t.commissionRate}%):</span>
                  <span className="font-mono font-bold text-slate-200">
                    ₨ {totalCommission.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Repair Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₨ {totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Technician Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{editingTech ? 'Edit Technician' : 'Add New Technician'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Technician Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ustad Ali Raza"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CNIC (National ID)</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={e => setCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Address / Workshop Bench</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Bench #3, Hafeez Centre, Lahore"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Base Monthly Salary (₨)</label>
                  <input
                    type="number"
                    min="0"
                    value={salary}
                    onChange={e => setSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Specializations Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Technical Specializations
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ALL_SPECIALIZATIONS.map(spec => {
                    const isSel = specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all ${
                          isSel
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '} {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="checkbox"
                  id="techActive"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="techActive" className="text-slate-300 cursor-pointer select-none">
                  Technician is currently Active & Available for job assignments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md shadow-indigo-950"
                >
                  {editingTech ? 'Update Technician' : 'Add Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
