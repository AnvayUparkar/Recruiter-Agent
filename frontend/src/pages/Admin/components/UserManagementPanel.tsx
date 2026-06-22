import React, { useState } from "react";
import { Users, Search, UserPlus, ShieldAlert, CheckCircle } from "lucide-react";
import { useAdminStore, SystemUser } from "../../../store/adminStore";

export const UserManagementPanel: React.FC = () => {
  const { users, updateUserRole, updateUserStatus, addUser } = useAdminStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Add User Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<SystemUser["role"]>("Recruiter");

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    
    addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Pending",
    });

    // Reset Form
    setNewName("");
    setNewEmail("");
    setNewRole("Recruiter");
    setShowAddModal(false);
  };

  const formatDate = (isoString: string) => {
    if (isoString === "Never") return "Never";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Users className="text-blue-500" size={20} />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">User Access Management</h3>
            <p className="text-xs text-slate-400">Manage recruiter logins and configure role access lists</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/15 select-none"
        >
          <UserPlus size={14} />
          Invite User
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus-ring"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-750 dark:text-slate-200 font-semibold outline-none focus-ring"
        >
          <option value="all">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Recruiter">Recruiter</option>
          <option value="Hiring Manager">Hiring Manager</option>
          <option value="Viewer">Viewer</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-750 dark:text-slate-200 font-semibold outline-none focus-ring"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto border border-slate-200/10 dark:border-slate-800/50 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-500/5 text-slate-400 font-extrabold uppercase border-b border-slate-200/10 dark:border-slate-800/50 select-none">
              <th className="p-4">Name / Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Active</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/50 font-medium">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No accounts matched active query filters.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-800 dark:text-slate-100">{user.name}</div>
                    <div className="text-[10px] text-slate-400 select-all">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      className="bg-transparent border border-slate-200/10 dark:border-slate-800/30 rounded px-2 py-1 outline-none text-[11px] font-bold text-slate-750 dark:text-slate-200 focus:bg-slate-900"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="Hiring Manager">Hiring Manager</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                      user.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : user.status === "Blocked"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{formatDate(user.lastLogin)}</td>
                  <td className="p-4 text-right space-x-2">
                    {user.status === "Active" ? (
                      <button
                        onClick={() => updateUserStatus(user.id, "Blocked")}
                        className="p-1 hover:bg-rose-500/10 rounded text-rose-500 transition-colors"
                        title="Block Access"
                        aria-label={`Block user ${user.name}`}
                      >
                        <ShieldAlert size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserStatus(user.id, "Active")}
                        className="p-1 hover:bg-emerald-500/10 rounded text-emerald-500 transition-colors"
                        title="Activate Access"
                        aria-label={`Activate user ${user.name}`}
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 bg-slate-500/5 hover:bg-slate-500/10 disabled:opacity-30 text-slate-400 disabled:hover:bg-transparent rounded-lg text-xs font-bold transition-all border border-slate-200/5 select-none"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 bg-slate-500/5 hover:bg-slate-500/10 disabled:opacity-30 text-slate-400 disabled:hover:bg-transparent rounded-lg text-xs font-bold transition-all border border-slate-200/5 select-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setShowAddModal(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
          />
          
          <form 
            onSubmit={handleAddSubmit}
            className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-2xl w-full max-w-sm relative z-10 space-y-4"
          >
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Invite New Recruiter</h4>
              <p className="text-[10px] text-slate-400">Sends an access token to start login setups.</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Parker"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus-ring font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="l.parker@recruiting.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus-ring font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-750 dark:text-slate-200 font-bold outline-none focus-ring"
                >
                  <option value="Admin">Admin</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Hiring Manager">Hiring Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/5 rounded-xl font-extrabold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow shadow-blue-600/20 transition-colors"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
