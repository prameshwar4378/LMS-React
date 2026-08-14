import React, { useState, useEffect, useRef } from 'react';
import CameraCaptureModal from './CameraCaptureModal';
import { useNotification } from '../context/NotificationContext';
import {
  UserPlus,
  User,
  Calendar,
  Phone,
  Users,
  CreditCard,
  Camera,
  Upload,
  FileText,
  X,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const GuestFormModal = ({ show, onClose, onSubmit, stayId }) => {
  const { showSuccess, showError } = useNotification();
  const nameInputRef = useRef(null);

  const [guestName, setGuestName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [ageError, setAgeError] = useState('');

  // Auto-focus on Full Name field when modal opens
  useEffect(() => {
    if (show) {
      setGuestName('');
      setAge('');
      setGender('Male');
      setMobile('');
      setRelationship('Spouse');
      setIdType('Aadhaar');
      setIdNumber('');
      setPhotoFile(null);
      setPhotoPreview('');
      setDocFile(null);
      setNameError('');
      setMobileError('');
      setAgeError('');
      setSubmitting(false);

      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 150);
    }
  }, [show]);

  if (!show) return null;

  const handleAgeChange = (val) => {
    setAge(val);
    if (val && (parseInt(val) < 0 || parseInt(val) > 120)) {
      setAgeError('Age must be between 0 and 120.');
    } else {
      setAgeError('');
    }
  };

  const handleMobileChange = (val) => {
    setMobile(val);
    if (val && val.length > 0 && !/^[0-9]{10}$/.test(val)) {
      setMobileError('Enter valid 10-digit mobile number.');
    } else {
      setMobileError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setNameError('');

    if (!guestName.trim()) {
      setNameError('Guest name is required.');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    if (ageError || mobileError) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('stay', stayId);
      formData.append('guest_name', guestName.trim());
      if (age) formData.append('age', age);
      formData.append('gender', gender);
      if (mobile) formData.append('mobile', mobile);
      if (relationship) formData.append('relationship', relationship);
      if (idType) formData.append('id_type', idType);
      if (idNumber) formData.append('id_number', idNumber);
      if (photoFile) formData.append('photo', photoFile);
      if (docFile) formData.append('id_document', docFile);

      await onSubmit(formData);
      showSuccess('Additional guest added successfully.', 'Guest Added');
      onClose();
    } catch (err) {
      console.error(err);
      showError('Error adding additional guest to roster.', 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="modal fade show d-block modal-backdrop-animated"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
        tabIndex="-1"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-animated"
          style={{ maxWidth: '760px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
            
            {/* 1. ELEGANT HEADER */}
            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                  <UserPlus size={22} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                    Add Additional Guest
                  </h5>
                  <span className="text-secondary extra-small">
                    Enter guest details and verify identification for this stay.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close shadow-none"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                
                {/* SECTION 1: GUEST INFORMATION */}
                <div className="mb-4">
                  <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                    <User size={14} /> Guest Information
                  </div>

                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <div className="position-relative">
                        <User size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        <input
                          ref={nameInputRef}
                          type="text"
                          className={`form-control ps-5 py-2.5 rounded-3 ${nameError ? 'is-invalid border-danger' : ''}`}
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          placeholder="Enter guest full name"
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value);
                            if (e.target.value.trim()) setNameError('');
                          }}
                        />
                      </div>
                      {nameError && (
                        <div className="text-danger extra-small mt-1 d-flex align-items-center gap-1">
                          <AlertCircle size={12} /> {nameError}
                        </div>
                      )}
                    </div>

                    {/* Age */}
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Age</label>
                      <div className="position-relative">
                        <Calendar size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        <input
                          type="number"
                          min="0"
                          max="120"
                          className={`form-control ps-5 py-2.5 rounded-3 ${ageError ? 'is-invalid border-danger' : ''}`}
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          placeholder="e.g. 28"
                          value={age}
                          onChange={(e) => handleAgeChange(e.target.value)}
                        />
                      </div>
                      {ageError && (
                        <div className="text-danger extra-small mt-1 d-flex align-items-center gap-1">
                          <AlertCircle size={12} /> {ageError}
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="col-md-4 col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Gender</label>
                      <select
                        className="form-select py-2.5 rounded-3 font-medium"
                        style={{ height: '46px', fontSize: '0.925rem' }}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONTACT & RELATIONSHIP */}
                <div className="mb-4">
                  <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                    <Phone size={14} /> Contact & Relationship
                  </div>

                  <div className="row g-3">
                    {/* Mobile Number */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Mobile Number</label>
                      <div className="position-relative">
                        <Phone size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        <input
                          type="tel"
                          className={`form-control ps-5 py-2.5 rounded-3 ${mobileError ? 'is-invalid border-danger' : ''}`}
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          placeholder="e.g. 98230XXXXX"
                          value={mobile}
                          onChange={(e) => handleMobileChange(e.target.value)}
                        />
                      </div>
                      {mobileError && (
                        <div className="text-danger extra-small mt-1 d-flex align-items-center gap-1">
                          <AlertCircle size={12} /> {mobileError}
                        </div>
                      )}
                    </div>

                    {/* Relationship */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Relationship with Primary Guest</label>
                      <div className="position-relative">
                        <Users size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ zIndex: 5 }} />
                        <select
                          className="form-select ps-5 py-2.5 rounded-3 font-medium"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Child">Child</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: IDENTITY VERIFICATION */}
                <div className="mb-4">
                  <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                    <CreditCard size={14} /> Identity Verification
                  </div>
                  <div className="text-muted extra-small mb-2.5">
                    Provide a valid statutory identity document for the additional guest.
                  </div>

                  <div className="row g-3">
                    {/* ID Proof Type */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">ID Proof Type</label>
                      <select
                        className="form-select py-2.5 rounded-3 font-medium"
                        style={{ height: '46px', fontSize: '0.925rem' }}
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Other">Other ID Proof</option>
                      </select>
                    </div>

                    {/* ID Proof Number */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">ID Proof Number</label>
                      <div className="position-relative">
                        <CreditCard size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        <input
                          type="text"
                          className="form-control ps-5 py-2.5 rounded-3"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          placeholder={`Enter ${idType} number`}
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: GUEST PHOTO & DOCUMENTS */}
                <div>
                  <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                    <FileText size={14} /> Guest Photo & ID Document
                  </div>

                  <div className="row g-3">
                    {/* Left Column: Guest Photo */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1 d-block">Guest Photo</label>
                      
                      {photoPreview ? (
                        <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between gap-3">
                          <img
                            src={photoPreview}
                            alt="Guest Snapshot"
                            className="rounded-3 border object-fit-cover shadow-xs"
                            style={{ width: '60px', height: '60px' }}
                          />
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold text-dark small text-truncate">Photo Captured</div>
                            <div className="text-success extra-small d-flex align-items-center gap-1 mt-0.5">
                              <CheckCircle2 size={12} /> Ready to attach
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-1 px-2 rounded-2 extra-small"
                              onClick={() => setShowCamera(true)}
                              title="Retake Snapshot"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-1 px-2 rounded-2 extra-small"
                              onClick={() => {
                                setPhotoFile(null);
                                setPhotoPreview('');
                              }}
                              title="Remove Photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary fw-semibold py-2.5 px-3 rounded-3 w-50 d-flex align-items-center justify-content-center gap-1.5"
                            style={{ height: '46px', fontSize: '0.85rem' }}
                            onClick={() => setShowCamera(true)}
                          >
                            <Camera size={18} /> Capture
                          </button>
                          
                          <label
                            className="btn btn-outline-secondary fw-semibold py-2.5 px-3 rounded-3 w-50 d-flex align-items-center justify-content-center gap-1.5 m-0 cursor-pointer"
                            style={{ height: '46px', fontSize: '0.85rem' }}
                          >
                            <Upload size={18} /> Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="d-none"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  setPhotoFile(e.target.files[0]);
                                  setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Upload ID Document Dropzone */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1 d-block">Upload ID Document</label>
                      
                      {docFile ? (
                        <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2.5 min-w-0">
                            <div className="p-2 bg-primary-subtle text-primary rounded-2">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '140px' }}>
                                {docFile.name}
                              </div>
                              <div className="text-muted extra-small">
                                {(docFile.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-1">
                            <label className="btn btn-sm btn-outline-primary py-1 px-2 rounded-2 extra-small m-0 cursor-pointer" title="Replace File">
                              Replace
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="d-none"
                                onChange={(e) => {
                                  if (e.target.files[0]) setDocFile(e.target.files[0]);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-1 px-2 rounded-2 extra-small"
                              onClick={() => setDocFile(null)}
                              title="Remove File"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          className="border border-2 border-dashed rounded-3 p-3 text-center d-block bg-light bg-opacity-50 cursor-pointer hover-bg-light transition-all"
                          style={{ borderColor: '#cbd5e1' }}
                        >
                          <FileText size={22} className="text-primary mb-1" />
                          <div className="fw-semibold text-dark small">Upload ID Document</div>
                          <div className="text-muted extra-small">Click or drag & drop JPG, PNG or PDF</div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="d-none"
                            onChange={(e) => {
                              if (e.target.files[0]) setDocFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-light border fw-semibold px-4 py-2 rounded-3"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Adding Guest...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Add Guest
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <CameraCaptureModal
        show={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, previewUrl) => {
          setPhotoFile(file);
          setPhotoPreview(previewUrl);
        }}
      />
    </>
  );
};

export default GuestFormModal;
