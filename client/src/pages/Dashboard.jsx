import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import EmployeeModal from '../components/EmployeeModal';
import './Dashboard.css';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // null | 'add' | employee object
  const [deleteId, setDeleteId]   = useState(null);
  const [toast, setToast]         = useState('');
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await API.get('/employees');
      setEmployees(data);
    } catch {
      navigate('/login');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSave = async (form) => {
    if (modal && modal._id) {
      await API.put(`/employees/${modal._id}`, form);
      showToast('Employee updated.');
    } else {
      await API.post('/employees', form);
      showToast('Employee added.');
    }
    setModal(null);
    fetchEmployees();
  };

  const handleDelete = async () => {
    await API.delete(`/employees/${deleteId}`);
    setDeleteId(null);
    showToast('Employee removed.');
    fetchEmployees();
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  });

  const initials = (e) => `${e.firstName[0]}${e.lastName[0]}`.toUpperCase();
  const colorFor = (str) => {
    const colors = ['#f0a500','#e05c2a','#22c982','#3b82f6','#a855f7','#ec4899'];
    let hash = 0;
    for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-hex">⬡</span>
          <span className="logo-name">EMS</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">◈</span>
            <span>Employees</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Employee Directory</h1>
            <p className="dash-subtitle">
              <span className="mono">{employees.length}</span> total records
            </p>
          </div>
          <div className="header-actions">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-add" onClick={() => setModal('add')}>
              + Add Employee
            </button>
          </div>
        </header>

        {/* Stats row */}
        <div className="stats-row">
          {['Total', 'Departments', 'This Month'].map((label, i) => {
            const vals = [
              employees.length,
              new Set(employees.map(e => e.department)).size,
              employees.filter(e => {
                const d = new Date(e.createdAt);
                const n = new Date();
                return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
              }).length
            ];
            return (
              <div className="stat-card" key={label}>
                <span className="stat-val">{vals[i]}</span>
                <span className="stat-label">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">
              <div className="loading-dots"><span/><span/><span/></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">◫</p>
              <p>{search ? 'No results found.' : 'No employees yet.'}</p>
              {!search && (
                <button className="btn-add sm" onClick={() => setModal('add')}>
                  Add your first employee
                </button>
              )}
            </div>
          ) : (
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="emp-name-cell">
                        <div
                          className="avatar"
                          style={{ background: colorFor(emp.firstName + emp.lastName) }}
                        >
                          {initials(emp)}
                        </div>
                        <span>{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td><span className="mono muted">{emp.email}</span></td>
                    <td>{emp.position}</td>
                    <td>
                      <span className="dept-tag">{emp.department}</span>
                    </td>
                    <td>
                      <span className="mono muted">
                        {new Date(emp.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn edit" onClick={() => setModal(emp)}>Edit</button>
                        <button className="action-btn del" onClick={() => setDeleteId(emp._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modal && (
        <EmployeeModal
          employee={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="confirm-box">
            <p className="confirm-icon">⚠</p>
            <h3>Delete employee?</h3>
            <p className="confirm-sub">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
