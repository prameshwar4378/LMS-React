import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomersApi, createCustomerApi, updateCustomerApi, deleteCustomerApi } from '../api/customerApi';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomersApi(search);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormError('');
    setFirstName(c.first_name || '');
    setMiddleName(c.middle_name || '');
    setLastName(c.last_name || '');
    setMobile(c.mobile || '');
    setAltMobile(c.alternate_mobile || '');
    setEmail(c.email || '');
    setGender(c.gender || 'Male');
    setAddress(c.address || '');
    setCity(c.city || '');
    setState(c.state || '');
    setIdType(c.id_type || 'Aadhaar');
    setIdNumber(c.id_number || '');
    setPhotoFile(null);
    setPhotoPreview(c.photo || '');
    setDocFile(null);
    setShowModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!firstName || !mobile) {
      setFormError('First name and mobile number are required.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('first_name', firstName);
    if (middleName) formData.append('middle_name', middleName);
    if (lastName) formData.append('last_name', lastName);
    formData.append('mobile', mobile);
    if (altMobile) formData.append('alternate_mobile', altMobile);
    if (email) formData.append('email', email);
    formData.append('gender', gender);
    if (address) formData.append('address', address);
    if (city) formData.append('city', city);
    if (state) formData.append('state', state);
    formData.append('id_type', idType);
    if (idNumber) formData.append('id_number', idNumber);

    if (photoFile) formData.append('photo', photoFile);
    if (docFile) formData.append('id_document', docFile);

    try {
      if (editingCustomer) {
        await updateCustomerApi(editingCustomer.id, formData);
      } else {
        await createCustomerApi(formData);
      }
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.first_name?.[0] || err.response?.data?.mobile?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Error saving customer profile.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = (c) => {
    setConfirmModal({
      show: true,
      title: 'Delete Customer Profile',
      message: `Are you sure you want to permanently delete the profile of "${c.full_name}" (${c.mobile})? This action cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteCustomerApi(c.id);
          setConfirmModal({ show: false });
          loadCustomers();
        } catch (err) {
          alert(err.response?.data?.error || 'Error deleting customer record.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setMobile('');
    setAltMobile('');
    setEmail('');
    setGender('Male');
    setAddress('');
    setCity('');
    setState('');
    setIdType('Aadhaar');
    setIdNumber('');
    setPhotoFile(null);
    setPhotoPreview('');
    setDocFile(null);
    setFormError('');
  };

  return (
    <div className="container-fluid p-0">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark m-0">
            <i className="bi bi-people-fill text-primary me-2"></i>Customer Directory
          </h3>
          <span className="text-muted small">Manage guest directory, full profile edits, photos, and statutory ID proof documents</span>
        </div>
        <button className="btn btn-primary fw-bold shadow-sm px-4 py-2" onClick={handleOpenCreate}>
          <i className="bi bi-person-plus-fill me-2"></i>Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search customer by name, mobile #, email, or ID proof number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader fullScreen={false} message="Loading Guest Profiles..." />
      ) : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light text-muted small text-uppercase fw-bold">
                  <tr>
                    <th className="ps-4">Photo</th>
                    <th>Full Name</th>
                    <th>Mobile</th>
                    <th>City / Address</th>
                    <th>ID Proof</th>
                    <th>Stay History</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <i className="bi bi-person-x fs-1 d-block text-muted opacity-50 mb-2"></i>
                        No customer profiles found matching your search.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td className="ps-4">
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={c.full_name}
                              className="rounded-circle object-fit-cover shadow-sm border"
                              style={{ width: '42px', height: '42px' }}
                            />
                          ) : (
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: '42px', height: '42px' }}>
                              {c.first_name ? c.first_name[0].toUpperCase() : 'G'}
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="fw-bold text-dark">{c.full_name}</div>
                          <span className="text-muted small">{c.email || 'No email registered'}</span>
                        </td>

                        <td className="fw-bold text-primary">
                          <i className="bi bi-telephone me-1 text-muted"></i>{c.mobile}
                        </td>

                        <td>
                          <div className="fw-semibold text-dark">{c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : c.address || 'N/A'}</div>
                          {c.address && c.city && <span className="text-muted extra-small">{c.address}</span>}
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border fw-semibold">
                            {c.id_type}: {c.id_number || 'N/A'}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-info text-white fw-bold">
                            <i className="bi bi-journal-check me-1"></i>{c.stay_count || 0} Stay(s)
                          </span>
                        </td>

                        <td className="text-end pe-4">
                          <div className="btn-group btn-group-sm">
                            {/* View Profile */}
                            <Link to={`/customers/${c.id}`} className="btn btn-outline-primary" title="View Profile & Stay History">
                              <i className="bi bi-eye me-1"></i>Profile
                            </Link>

                            {/* Edit Customer */}
                            <button
                              className="btn btn-outline-secondary"
                              title="Edit Customer"
                              onClick={() => handleOpenEdit(c)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            {/* Delete Customer (Admin only) */}
                            {isAdmin && (
                              <button
                                className="btn btn-outline-danger"
                                title="Delete Customer Record"
                                onClick={() => handleDeleteCustomer(c)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white p-3">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingCustomer ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`}></i>
                  {editingCustomer ? `Edit Customer Profile — ${editingCustomer.full_name}` : 'Add New Customer Profile'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveCustomer}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{formError}</div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">First Name *</label>
                      <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Rameshwar" />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Middle Name</label>
                      <input type="text" className="form-control" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pawar" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Mobile Number *</label>
                      <input type="text" className="form-control fw-bold" required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9823012345" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Alternate Mobile</label>
                      <input type="text" className="form-control" value={altMobile} onChange={(e) => setAltMobile(e.target.value)} placeholder="Secondary contact" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Email Address</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Gender</label>
                      <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Residential Address</label>
                      <textarea className="form-control" rows="2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, landmark..."></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">City</label>
                      <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">State</label>
                      <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">ID Proof Type *</label>
                      <select className="form-select" value={idType} onChange={(e) => setIdType(e.target.value)}>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="PAN">PAN</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">ID Proof Number</label>
                      <input type="text" className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 1234-5678-9012" />
                    </div>

                    {/* Camera Capture / Photo Upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted d-block">Customer Photo Snapshot</label>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-outline-primary btn-sm fw-bold" onClick={() => setShowCamera(true)}>
                          <i className="bi bi-camera me-1"></i> Capture Camera
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setPhotoFile(e.target.files[0]);
                              setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                      </div>
                      {photoPreview && (
                        <div className="mt-2">
                          <img src={photoPreview} alt="Preview" className="img-thumbnail rounded object-fit-cover" style={{ height: '70px', width: '70px' }} />
                        </div>
                      )}
                    </div>

                    {/* ID Document Upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Upload Statutory ID Document</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="form-control form-control-sm"
                        onChange={(e) => setDocFile(e.target.files[0] || null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>{editingCustomer ? 'Save Profile Changes' : 'Create Customer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        show={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, previewUrl) => {
          setPhotoFile(file);
          setPhotoPreview(previewUrl);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Yes, Delete Customer"
        confirmBtnClass="btn-danger"
        loading={confirmModal.loading}
        onClose={() => setConfirmModal({ show: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default Customers;
