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
  AlertCircle,
  Eye,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const GuestFormModal = ({ show, onClose, onSubmit, stayId, editingGuest = null }) => {
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
  const [docPreview, setDocPreview] = useState('');
  const [docBackFile, setDocBackFile] = useState(null);
  const [docBackPreview, setDocBackPreview] = useState('');
  const [previewModalDoc, setPreviewModalDoc] = useState(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [ageError, setAgeError] = useState('');

  // Auto-focus on Full Name field when modal opens
  useEffect(() => {
    if (show) {
      if (editingGuest) {
        setGuestName(editingGuest.guest_name || '');
        setAge(editingGuest.age || '');
        setGender(editingGuest.gender || 'Male');
        setMobile(editingGuest.mobile || '');
        setRelationship(editingGuest.relationship || 'Spouse');
        setIdType(editingGuest.id_type || 'Aadhaar');
        setIdNumber(editingGuest.id_number || '');
        setPhotoFile(null);
        setPhotoPreview(editingGuest.photo || '');
        setDocFile(null);
        setDocPreview(editingGuest.id_document || '');
        setDocBackFile(null);
        setDocBackPreview(editingGuest.id_document_back || '');
      } else {
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
        setDocPreview('');
        setDocBackFile(null);
        setDocBackPreview('');
      }
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
  }, [show, editingGuest]);

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

  const openGuestDocPreview = (urlOrFile, title) => {
    if (!urlOrFile) return;
    let url = '';
    let isPdf = false;
    if (typeof urlOrFile === 'string') {
      url = urlOrFile;
      isPdf = url.toLowerCase().endsWith('.pdf');
    } else if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
      url = URL.createObjectURL(urlOrFile);
      isPdf = urlOrFile.type === 'application/pdf';
    }
    setPreviewModalDoc({ show: true, url, title, isPdf });
  };

  const handleDocFrontChange = (file) => {
    if (!file) return;
    setDocFile(file);
    if (file.type.startsWith('image/')) {
      setDocPreview(URL.createObjectURL(file));
    } else {
      setDocPreview(URL.createObjectURL(file));
    }
  };

  const handleDocBackChange = (file) => {
    if (!file) return;
    setDocBackFile(file);
    if (file.type.startsWith('image/')) {
      setDocBackPreview(URL.createObjectURL(file));
    } else {
      setDocBackPreview(URL.createObjectURL(file));
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
      if (docBackFile) formData.append('id_document_back', docBackFile);

      await onSubmit(formData, editingGuest?.id);
      showSuccess(
        editingGuest
          ? `Guest details for '${guestName.trim()}' updated successfully.`
          : 'Additional guest added successfully.',
        editingGuest ? 'Guest Updated' : 'Guest Added'
      );
      onClose();
    } catch (err) {
      console.error(err);
      showError(
        editingGuest
          ? 'Error updating additional guest details.'
          : 'Error adding additional guest to roster.',
        'Failed'
      );
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
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-animated"
          style={{ maxWidth: '760px' }}
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
                    {editingGuest ? 'Edit Additional Guest Details' : 'Add Additional Guest'}
                  </h5>
                  <span className="text-secondary extra-small">
                    {editingGuest
                      ? 'Update personal information, gender/age, mobile, and statutory ID document files.'
                      : 'Enter guest details and verify identification for this stay.'}
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
                  <div className="row g-3">
                    {/* Left Column: Guest Photo */}
                    {/* Guest Photo Row */}
                    <div className="col-md-12 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <label className="form-label small fw-semibold text-dark m-0">Guest Photo Snapshot</label>
                        {(photoFile || photoPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <CheckCircle2 size={12} /> {photoFile ? 'New Photo Attached' : '✓ Photo Verified'}
                          </span>
                        )}
                      </div>
                      
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-outline-primary fw-semibold py-2 px-3 rounded-3 d-inline-flex align-items-center gap-1.5"
                          onClick={() => setShowCamera(true)}
                        >
                          <Camera size={17} /> Capture Webcam
                        </button>
                        
                        <label className="btn btn-light border fw-semibold py-2 px-3 rounded-3 m-0 cursor-pointer d-inline-flex align-items-center gap-1.5 hover-bg-light">
                          <Upload size={17} /> Upload Photo File
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

                        {(photoFile || photoPreview) && (
                          <div className="d-flex align-items-center gap-2 bg-light p-1.5 rounded-3 border ms-auto">
                            <img
                              src={photoPreview}
                              alt="Guest Snapshot"
                              className="rounded-circle object-fit-cover cursor-pointer border shadow-xs"
                              style={{ width: '42px', height: '42px' }}
                              onClick={() => openGuestDocPreview(photoFile || photoPreview, `${guestName || 'Guest'} Photo`)}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-1 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                              onClick={() => openGuestDocPreview(photoFile || photoPreview, `${guestName || 'Guest'} Photo`)}
                              title="Preview Photo"
                            >
                              <Eye size={13} /> Preview
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                              onClick={() => {
                                setPhotoFile(null);
                                setPhotoPreview('');
                              }}
                              title="Remove Photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Document (Front Side) Dropzone */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <label className="form-label small fw-semibold text-dark m-0">ID Document (Front Side)</label>
                        {(docFile || docPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <CheckCircle2 size={12} /> {docFile ? 'New Document' : '✓ Verified Document'}
                          </span>
                        )}
                      </div>
                      
                      {docFile || docPreview ? (
                        <div className="p-2.5 bg-light rounded-3 border border-success-subtle">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              {((docFile && docFile.type && docFile.type.startsWith('image/')) || (typeof docPreview === 'string' && (docPreview.startsWith('blob:') || docPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                <img
                                  src={docPreview}
                                  alt="Front ID"
                                  className="rounded border object-fit-cover flex-shrink-0 cursor-pointer shadow-xs"
                                  style={{ width: '52px', height: '40px' }}
                                  onClick={() => openGuestDocPreview(docFile || docPreview, 'Front ID Document')}
                                />
                              ) : (
                                <div className="bg-white text-danger p-1.5 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '40px' }}>
                                  <FileText size={20} />
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-truncate small fw-bold text-dark" style={{ maxWidth: '140px' }}>
                                  {docFile ? docFile.name : (docPreview.split('/').pop() || 'Front_ID_Document')}
                                </div>
                                <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                                  {docFile ? `New File (${(docFile.size / 1024).toFixed(1)} KB)` : 'Document on File'}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary py-1 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                onClick={() => openGuestDocPreview(docFile || docPreview, 'Front ID Document')}
                                title="Preview Document"
                              >
                                <Eye size={13} /> Preview
                              </button>
                              <label
                                className="btn btn-sm btn-light border py-1 px-2 extra-small fw-semibold rounded-2 m-0 cursor-pointer d-inline-flex align-items-center gap-1 hover-bg-light"
                                title="Replace Document"
                              >
                                <RefreshCw size={12} /> Edit
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="d-none"
                                  onChange={(e) => {
                                    if (e.target.files[0]) handleDocFrontChange(e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                                onClick={() => { setDocFile(null); setDocPreview(''); }}
                                title="Remove Document"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label
                          className="border border-2 border-dashed rounded-3 p-3 text-center d-block bg-light bg-opacity-50 cursor-pointer hover-bg-white transition-all m-0"
                          style={{ borderColor: '#cbd5e1' }}
                        >
                          <FileText size={22} className="text-primary mb-1" />
                          <div className="fw-semibold text-dark small">Upload Front Side</div>
                          <div className="text-muted extra-small">Click or drag & drop JPG, PNG or PDF</div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="d-none"
                            onChange={(e) => {
                              if (e.target.files[0]) handleDocFrontChange(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* ID Document (Back Side) Dropzone */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <label className="form-label small fw-semibold text-dark m-0">ID Document (Back Side)</label>
                        {(docBackFile || docBackPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <CheckCircle2 size={12} /> {docBackFile ? 'New Document' : '✓ Verified Document'}
                          </span>
                        )}
                      </div>
                      
                      {docBackFile || docBackPreview ? (
                        <div className="p-2.5 bg-light rounded-3 border border-success-subtle">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              {((docBackFile && docBackFile.type && docBackFile.type.startsWith('image/')) || (typeof docBackPreview === 'string' && (docBackPreview.startsWith('blob:') || docBackPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                <img
                                  src={docBackPreview}
                                  alt="Back ID"
                                  className="rounded border object-fit-cover flex-shrink-0 cursor-pointer shadow-xs"
                                  style={{ width: '52px', height: '40px' }}
                                  onClick={() => openGuestDocPreview(docBackFile || docBackPreview, 'Back ID Document')}
                                />
                              ) : (
                                <div className="bg-white text-danger p-1.5 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '40px' }}>
                                  <FileText size={20} />
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-truncate small fw-bold text-dark" style={{ maxWidth: '140px' }}>
                                  {docBackFile ? docBackFile.name : (docBackPreview.split('/').pop() || 'Back_ID_Document')}
                                </div>
                                <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                                  {docBackFile ? `New File (${(docBackFile.size / 1024).toFixed(1)} KB)` : 'Document on File'}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary py-1 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                onClick={() => openGuestDocPreview(docBackFile || docBackPreview, 'Back ID Document')}
                                title="Preview Document"
                              >
                                <Eye size={13} /> Preview
                              </button>
                              <label
                                className="btn btn-sm btn-light border py-1 px-2 extra-small fw-semibold rounded-2 m-0 cursor-pointer d-inline-flex align-items-center gap-1 hover-bg-light"
                                title="Replace Document"
                              >
                                <RefreshCw size={12} /> Edit
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="d-none"
                                  onChange={(e) => {
                                    if (e.target.files[0]) handleDocBackChange(e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                                onClick={() => { setDocBackFile(null); setDocBackPreview(''); }}
                                title="Remove Document"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label
                          className="border border-2 border-dashed rounded-3 p-3 text-center d-block bg-light bg-opacity-50 cursor-pointer hover-bg-white transition-all m-0"
                          style={{ borderColor: '#cbd5e1' }}
                        >
                          <FileText size={22} className="text-primary mb-1" />
                          <div className="fw-semibold text-dark small">Upload Back Side</div>
                          <div className="text-muted extra-small">Click or drag & drop JPG, PNG or PDF</div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="d-none"
                            onChange={(e) => {
                              if (e.target.files[0]) handleDocBackChange(e.target.files[0]);
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
                      {editingGuest ? 'Saving Profile...' : 'Adding Guest...'}
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> {editingGuest ? 'Save Guest Profile' : 'Add Guest'}
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

      {/* Document & Photo Fullscreen Preview Modal */}
      {previewModalDoc && previewModalDoc.show && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-animated">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2 m-0">
                  <FileText size={18} className="text-primary" /> {previewModalDoc.title}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {previewModalDoc.url && (
                    <a
                      href={previewModalDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-light py-1 px-2.5 extra-small fw-semibold d-inline-flex align-items-center gap-1"
                    >
                      <ExternalLink size={13} /> Open in New Tab
                    </a>
                  )}
                  <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setPreviewModalDoc(null)}></button>
                </div>
              </div>
              <div className="modal-body p-3 bg-light text-center" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {previewModalDoc.isPdf ? (
                  <iframe src={previewModalDoc.url} title={previewModalDoc.title} className="w-100 rounded border bg-white" style={{ height: '600px' }}></iframe>
                ) : (
                  <img
                    src={previewModalDoc.url}
                    alt={previewModalDoc.title}
                    className="img-fluid rounded border shadow-sm"
                    style={{ maxHeight: '65vh', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuestFormModal;
