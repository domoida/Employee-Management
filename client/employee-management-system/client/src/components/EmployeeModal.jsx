import { useState, useEffect } from 'react';
import './EmployeeModal.css';

const EMPTY = { firstName: '', lastName: '', email: '', position: '', department: '' };

export default function EmployeeModal({ employee, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(employee ? { ...employee } : EMPTY);
    setError('');
  }, [employee]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    const { firstName, lastName, email, position, department } = form;
    if (!firstName || !lastName || !email || !position || !department)
      return setError('All fields are required.');
    setLoading(true); setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Try again.');
      setLoading(false);
    }
  };

  const fields = [
    { name: 'firstName', label: 'First Name',  placeholder: 'Jane' },
    { name: 'lastName',  label: 'Last Name',   placeholder: 'Smith' },
    { name: 'email',     label: 'Email',        placeholder: 'jane@company.com', type: 'email' },
    { name: 'position',  label: 'Position',     placeholder: 'Software Engineer' },
    { name: 'department',label: 'Department',   placeholder: 'Engineering' },
  ];

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-grid">
          {fields.map(f => (
            <div key={f.name} className={`modal-field ${f.name === 'email' ? 'full' : ''}`}>
              <label>{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handle}
              />
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner-sm" /> : (employee ? 'Save Changes' : 'Add Employee')}
          </button>
        </div>
      </div>
    </div>
  );
}
