import React, { useState } from 'react';
import CameraCaptureModal from './CameraCaptureModal';

const GuestFormModal = ({ show, onClose, onSubmit, stayId }) => {
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

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('stay', stayId);
    formData.append('guest_name', guestName);
    if (age) formData.append('age', age);
    formData.append('gender', gender);
    if (mobile) formData.append('mobile', mobile);
    if (relationship) formData.append('relationship', relationship);
    if (idType) formData.append('id_type', idType);
    if (idNumber) formData.append('id_number', idNumber);
    if (photoFile) formData.append('photo', photoFile);
    if (docFile) formData.append('id_document', docFile);

    onSubmit(formData);
  };

  return (
    <>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Add Additional Guest</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input type="text" className="form-control" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Mauli Pawar" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Age</label>
                    <input type="number" className="form-control" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Gender</label>
                    <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Mobile Number</label>
                    <input type="text" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98230XXXXX" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Relationship with Primary Guest</label>
                    <input type="text" className="form-control" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Spouse / Friend / Child" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">ID Proof Type</label>
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
                    <label className="form-label fw-semibold">ID Proof Number</label>
                    <input type="text" className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter ID number" />
                  </div>

                  {/* Photo Section */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-block">Guest Photo</label>
                    <div className="d-flex align-items-center gap-2">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowCamera(true)}>
                        <i className="bi bi-camera me-1"></i> Capture Camera
                      </button>
                      <input type="file" accept="image/*" className="form-control form-control-sm" onChange={(e) => {
                        if (e.target.files[0]) {
                          setPhotoFile(e.target.files[0]);
                          setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </div>
                    {photoPreview && (
                      <div className="mt-2">
                        <img src={photoPreview} alt="Preview" className="img-thumbnail rounded" style={{ height: '70px', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  {/* Document Upload */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Upload ID Document</label>
                    <input type="file" accept="image/*,application/pdf" className="form-control form-control-sm" onChange={(e) => setDocFile(e.target.files[0] || null)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="bi bi-check-circle me-1"></i> Add Guest</button>
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
