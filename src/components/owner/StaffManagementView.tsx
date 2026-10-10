import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, UserRole } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Building,
  Mail,
  Check,
  X,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { users, branches, allBranches, addUser, updateUserRole, currentBranch } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const safeUsers = users || [];
  const safeBranches = branches || allBranches || [];

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('biller');
  const [branchId, setBranchId] = useState(currentBranch?.id || 'branch-1');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const branchObj = safeBranches.find(b => b.id === branchId);
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      branchId,
      branchName: branchObj?.name || 'Downtown Flagship',
      phone: '+1 (555) 000-1122',
      active: true,
      joinedDate: new Date().toISOString().slice(0, 10),
      billsCount: 0,
      totalSales: 0,
    };
    addUser(newUser);
    setName('');
    setEmail('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Staff & Access Control
            </h3>
            <p className="text-xs text-slate-400">
              Manage enterprise roles, permissions, and assigned branch locations
            </p>
          </div>
        </div>

        <button
          id="open-add-staff-modal-button"
          onClick={() => setIsAddModalOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 hover:bg-teal-700 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Team Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {safeUsers.map(user => {
          const branch = safeBranches.find(b => b.id === user.branchId);

          return (
            <div
              key={user.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      user.role === 'owner'
                        ? 'bg-purple-500/10 text-purple-600'
                        : user.role === 'manager'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" /> Assigned Branch:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {branch?.name || 'All Branches'}
                    </span>
                  </div>
                  {user.role === 'biller' && (
                    <div className="flex items-center justify-between">
                      <span>Total Sales Done:</span>
                      <span className="font-bold text-teal-600">
                        {formatINR(user.totalSales || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role selector dropdown */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Change Role:</span>
                <select
                  value={user.role}
                  onChange={e => updateUserRole(user.id, e.target.value as UserRole)}
                  className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="biller">Biller</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add New Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Work Email:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rachel@billgenius.com"
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Role:
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="biller">Biller (POS Terminal)</option>
                    <option value="manager">Manager (Inventory)</option>
                    <option value="owner">Owner (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Store Location:
                  </label>
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {safeBranches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="confirm-create-staff-button"
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
