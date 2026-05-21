import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, X, Search, Edit2, Trash2, ChevronLeft, Sun, Moon, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Edit mode state
  const [editingAdminId, setEditingAdminId] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Error/Success state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Fetch admin accounts from database
  const fetchAdmins = async () => {
    const token = sessionStorage.getItem('token');
    try {
      const response = await fetch('/api/auth/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAdmins(data.admins);
      } else {
        setError(data.message || 'Failed to fetch admin accounts');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Could not load admin accounts.');
    }
  };

  // Auto-clear feedback messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmpId('');
    setPassword('');
    setConfirmPassword('');
    setEditingAdminId(null);
  };

  // Handle Form Submission (Create or Update Admin)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = sessionStorage.getItem('token');
    const endpoint = editingAdminId ? `/api/auth/admins/${editingAdminId}` : '/api/auth/create-admin';
    const method = editingAdminId ? 'PUT' : 'POST';

    // Basic Validations
    if (!firstName.trim() || !lastName.trim() || !empId.trim()) {
      setError('First name, Last name, and Employee ID are required.');
      return;
    }

    if (!editingAdminId) {
      if (!password || !confirmPassword) {
        setError('Password and Confirm Password are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = editingAdminId
        ? { firstName: firstName.trim(), lastName: lastName.trim(), empId: empId.trim() }
        : { firstName: firstName.trim(), lastName: lastName.trim(), empId: empId.trim(), password, confirmPassword };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Operation successful.');
        resetForm();
        fetchAdmins();
      } else {
        setError(data.message || 'Operation failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Populate form for editing
  const handleEditClick = (admin) => {
    setEditingAdminId(admin.id);
    setFirstName(admin.firstName);
    setLastName(admin.lastName);
    setEmpId(admin.empId);
    setPassword('');
    setConfirmPassword('');
  };

  // Handle delete admin
  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the admin account for "${name}"?`)) return;

    setError('');
    setSuccess('');
    const token = sessionStorage.getItem('token');

    try {
      const response = await fetch(`/api/auth/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Admin account deleted.');
        if (editingAdminId === id) resetForm();
        fetchAdmins();
      } else {
        setError(data.message || 'Failed to delete admin.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--industrial-bg)] text-[var(--industrial-text)] transition-colors duration-500 pb-20">
      {/* ── Navigation ── */}
      <nav className="bg-[var(--industrial-card)]/80 backdrop-blur-xl sticky top-0 z-30 border-b border-[var(--industrial-border)] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl bg-[var(--industrial-text)]/5 hover:bg-[var(--industrial-text)]/10 text-[var(--industrial-text)] mr-4 transition-all duration-300 border border-[var(--industrial-border)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="p-2 rounded-xl gold-gradient gold-glow mr-3">
                  <Shield className="w-5 h-5 text-[#0B0F19]" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-[var(--industrial-text)] tracking-tight leading-none">Admin Management</h1>
                  <p className="text-[10px] font-black text-[var(--industrial-text-muted)] uppercase tracking-[0.15em] mt-1.5">Manage Access Rights</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center p-2 rounded-xl bg-[var(--industrial-text)]/5 hover:bg-[var(--industrial-text)]/10 text-[var(--industrial-text-muted)] hover:text-[var(--industrial-text)] transition-all duration-300 border border-[var(--industrial-border)] shadow-sm"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#D4AF37] hover:rotate-45 transition-transform duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-[#D4AF37] hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-[var(--industrial-text)] tracking-tight">Admin Accounts</h2>
          <p className="text-[var(--industrial-text-muted)] font-bold mt-1 text-sm">
            Admin dashboard to create, update, and manage administrative credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Create / Edit Admin Form */}
          <div className="lg:col-span-4 bg-[var(--industrial-card)] border border-[var(--industrial-border)] rounded-[2rem] p-6 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 gold-gradient rounded-t-[2rem]"></div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-[var(--industrial-text-muted)] uppercase tracking-widest flex items-center">
                {editingAdminId ? 'Edit Credentials' : 'New Admin Entry'}
              </h3>
              {editingAdminId && (
                <button
                  onClick={resetForm}
                  className="flex items-center text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded-lg bg-red-500/5 transition-colors"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest ml-1">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest ml-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Employee ID */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest ml-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="Employee ID (unique login key)"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password (only in create mode) */}
              {!editingAdminId && (
                <>
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest ml-1">Security Key (Password)</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest ml-1">Confirm Security Key</label>
                    <input
                      type="password"
                      placeholder="Repeat Security Key"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Feedback messages */}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-in zoom-in duration-300">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-in zoom-in duration-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl gold-gradient gold-glow text-[#0B0F19] text-xs font-black transition-all duration-300 hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {editingAdminId ? 'Save Changes' : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Create Admin Account
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right panel: Registered Admins List */}
          <div className="lg:col-span-8 bg-[var(--industrial-card)] border border-[var(--industrial-border)] rounded-[2.5rem] shadow-2xl overflow-hidden">
            {/* Header / Filter */}
            <div className="px-6 py-6 border-b border-[var(--industrial-border)] bg-[var(--industrial-text)]/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xs font-black text-[var(--industrial-text-muted)] uppercase tracking-widest flex items-center">
                Registered Administrators
                <span className="ml-2.5 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black rounded-lg border border-[#D4AF37]/20">
                  {admins.length} Total
                </span>
              </h3>

              {/* Master Search Bar */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-[var(--industrial-text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="Search admin accounts..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--industrial-border)] focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/40 transition-all duration-300 bg-[var(--industrial-text)]/5 text-xs font-bold text-[var(--industrial-text)] outline-none placeholder:text-[var(--industrial-text-muted)]/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[var(--industrial-text)]/5">
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest">Employee ID</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-[var(--industrial-text-muted)] uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--industrial-border)]">
                  {admins
                    .filter(admin =>
                      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      admin.empId.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(admin => {
                      const isSuper = admin.role === 'SUPER_ADMIN';
                      const fullName = `${admin.firstName} ${admin.lastName}`;
                      return (
                        <tr key={admin.id} className="hover:bg-[#D4AF37]/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-black text-[var(--industrial-text)]">{fullName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-[var(--industrial-text-muted)]">{admin.empId}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border ${isSuper
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-[var(--industrial-text)]/5 text-[var(--industrial-text-muted)] border-[var(--industrial-border)]'
                              }`}>
                              {admin.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end items-center space-x-2">
                              {/* Edit option for Normal Admins only (or Super Admin to edit details, but Super Admin can't delete themselves) */}
                              <button
                                onClick={() => handleEditClick(admin)}
                                className="text-[var(--industrial-text-muted)]/60 hover:text-[#D4AF37] transition-all duration-300 p-1.5 rounded-lg hover:bg-[#D4AF37]/10"
                                title="Edit Admin"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Super Admin can delete Normal Admins, but not themselves */}
                              {!isSuper && (
                                <button
                                  onClick={() => handleDeleteClick(admin.id, fullName)}
                                  className="text-[var(--industrial-text-muted)]/60 hover:text-red-500 transition-all duration-300 p-1.5 rounded-lg hover:bg-red-500/10"
                                  title="Delete Admin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-xs font-bold text-[var(--industrial-text-muted)]">
                        No admin accounts loaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
