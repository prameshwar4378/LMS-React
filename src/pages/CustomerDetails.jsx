import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCustomerHistoryApi, updateCustomerApi, deleteCustomerApi } from '../api/customerApi';
import StatusBadge from '../components/StatusBadge';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
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

  // Delete Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });

  useEffect(() => {
    loadHistory();
  }, [id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getCustomerHistoryApi(id);
      setCustomer(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!customer) return;
    setFormError('');
    setFirstName(customer.first_name || '');
    setMiddleName(customer.middle_name || '');
    setLastName(customer.last_name || '');
    setMobile(customer.mobile || '');
    setAltMobile(customer.alternate_mobile || '');
    setEmail(customer.email || '');
    setGender(customer.gender || 'Male');
    setAddress(customer.address || '');
    setCity(customer.city || '');
    setState(customer.state || '');
    setIdType(customer.id_type || 'Aadhaar');
    setIdNumber(customer.id_number || '');
    setPhotoFile(null);
    setPhotoPreview(customer.photo || '');
    setDocFile(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
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
      await updateCustomerApi(customer.id, formData);
      setShowEditModal(false);
      loadHistory();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.first_name?.[0] || err.response?.data?.mobile?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Error saving customer profile.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (!customer) return;
    setConfirmModal({
      show: true,
      title: 'Delete Customer Profile',
      message: `Are you sure you want to permanently delete customer "${customer.full_name}" (${customer.mobile})? All associated records will be removed.`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteCustomerApi(customer.id);
          setConfirmModal({ show: false });
          showSuccess(`Customer profile '${customer.full_name}' deleted successfully.`, 'Customer Deleted');
          navigate('/customers');
        } catch (err) {
          showError(err.response?.data?.error || 'Error deleting customer record.', 'Deletion Failed');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Customer Profile & Stay History..." />;
  }

  if (!customer) {
    return <div className="alert alert-danger">Customer record not found.</div>;
  }

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark m-0">
            <i className="bi bi-person-lines-fill text-primary me-2"></i>Customer Profile & History
          </h3>
          <span className="text-muted small">Guest details, statutory ID proof documents, and stay records</span>
        </div>
        <div className="d-flex gap-2">
          {/* Edit Customer Button */}
          <button className="btn btn-outline-primary fw-bold" onClick={handleOpenEdit}>
            <i className="bi bi-pencil-square me-1"></i> Edit Profile
          </button>

          {/* Delete Customer Button (Admin Only) */}
          {isAdmin && (
            <button className="btn btn-outline-danger fw-bold" onClick={handleDeleteCustomer}>
              <i className="bi bi-trash me-1"></i> Delete Record
            </button>
          )}

          <Link to="/customers" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Back to Directory
          </Link>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Customer Info Sidebar Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm text-center p-4 rounded-3">
            <div className="position-relative d-inline-block mx-auto mb-3">
              {customer.photo ? (
                <img
                  src={customer.photo}
                  alt={customer.full_name}
                  className="rounded-circle border border-3 border-primary shadow"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-1 mx-auto shadow" style={{ width: '120px', height: '120px' }}>
                  {customer.first_name ? customer.first_name[0].toUpperCase() : 'G'}
                </div>
              )}
            </div>

            <h4 className="fw-bold m-0 text-dark">{customer.full_name}</h4>
            <div className="text-primary fw-semibold mt-1">
              <i className="bi bi-telephone me-1"></i>{customer.mobile}
            </div>
            {customer.alternate_mobile && (
              <div className="text-muted small">Alt: {customer.alternate_mobile}</div>
            )}
            {customer.email && <div className="text-muted small">{customer.email}</div>}

            <hr className="my-3" />

            <div className="text-start small">
              <div className="mb-2"><strong>ID Proof Type:</strong> <span className="badge bg-light text-dark border ms-1">{customer.id_type}</span></div>
              <div className="mb-2"><strong>ID Proof Number:</strong> <span className="fw-bold text-dark">{customer.id_number || 'Not provided'}</span></div>
              <div className="mb-2"><strong>Gender:</strong> {customer.gender}</div>
              <div className="mb-2"><strong>Address:</strong> {customer.address || 'N/A'}{customer.city ? `, ${customer.city}` : ''} {customer.state ? `, ${customer.state}` : ''}</div>
            </div>

            {customer.id_document && (
              <div className="mt-3">
                <a href={customer.id_document} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary w-100 fw-bold">
                  <i className="bi bi-file-earmark-medical me-1"></i> View Uploaded ID Document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Previous Stays Table Card */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="m-0 fw-bold text-dark">
                <i className="bi bi-clock-history me-2 text-primary"></i>Previous Stay History
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light text-muted small text-uppercase fw-bold">
                    <tr>
                      <th className="ps-3">Stay #</th>
                      <th>Room</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Grand Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.stays?.length === 0 ? (
                      <tr><td colSpan="9" className="text-center text-muted py-5">No previous stay records found for this guest.</td></tr>
                    ) : (
                      customer.stays?.map((s) => (
                        <tr key={s.id}>
                          <td className="ps-3 fw-bold text-dark">{s.stay_number}</td>
                          <td><span className="badge bg-primary">Room {s.room_number}</span></td>
                          <td>{formatDate(s.check_in_date)}</td>
                          <td>{formatDate(s.checkout_date)}</td>
                          <td className="fw-semibold">{formatCurrency(s.grand_total)}</td>
                          <td className="text-success fw-semibold">{formatCurrency(s.total_paid)}</td>
                          <td className={`fw-bold ${s.balance > 0 ? 'text-danger' : 'text-muted'}`}>{formatCurrency(s.balance)}</td>
                          <td><StatusBadge status={s.status} /></td>
                          <td className="text-end pe-3">
                            <Link to={`/stays/${s.id}`} className="btn btn-sm btn-outline-primary py-0 px-2">
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white p-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>Edit Customer Profile — {customer.full_name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleSaveEdit}>
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
                      <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Middle Name</label>
                      <input type="text" className="form-control" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Mobile Number *</label>
                      <input type="text" className="form-control fw-bold" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Alternate Mobile</label>
                      <input type="text" className="form-control" value={altMobile} onChange={(e) => setAltMobile(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Email Address</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                      <textarea className="form-control" rows="2" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">City</label>
                      <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">State</label>
                      <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} />
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
                      <input type="text" className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                    </div>

                    {/* Camera Capture / Photo Upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted d-block">Customer Photo</label>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>Save Profile Changes
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

export default CustomerDetails;
