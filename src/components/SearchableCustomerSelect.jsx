import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../utils/dateUtils';

const SearchableCustomerSelect = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  placeholder = "Search customer by name, mobile, or ID..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const containerRef = useRef(null);

  // Find currently selected customer object
  const selectedCust = customers.find(
    (c) => String(c.id) === String(selectedCustomerId)
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers by name, mobile, email, or ID number
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const mobile = (c.mobile || '').toLowerCase();
    const idNum = (c.id_number || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return fullName.includes(q) || mobile.includes(q) || idNum.includes(q) || email.includes(q);
  });

  const handleSelect = (cust) => {
    onSelectCustomer(cust.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelectCustomer('');
    setSearchQuery('');
  };

  return (
    <div className="position-relative" ref={containerRef}>
      {selectedCust ? (
        /* Selected Customer Preview Card */
        <div className="p-3 bg-light rounded-3 border border-primary d-flex align-items-center justify-content-between shadow-sm">
          <div className="d-flex align-items-center gap-3">
            {selectedCust.photo ? (
              <img
                src={selectedCust.photo}
                alt={selectedCust.full_name}
                className="rounded-circle border shadow-sm flex-shrink-0"
                style={{ width: '42px', height: '42px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="bi bi-person-fill fs-5"></i>
              </div>
            )}
            <div>
              <div className="fw-bold text-dark fs-6">
                {selectedCust.full_name || `${selectedCust.first_name} ${selectedCust.last_name || ''}`}
              </div>
              <div className="small text-muted">
                <i className="bi bi-telephone text-success me-1"></i>{selectedCust.mobile} |{' '}
                <i className="bi bi-card-heading text-warning me-1"></i>{selectedCust.id_type || 'ID'}: {selectedCust.id_number || 'N/A'}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-primary fw-semibold shadow-sm"
              onClick={() => setShowDetailsModal(true)}
            >
              <i className="bi bi-eye-fill me-1"></i> View Details
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger fw-semibold"
              onClick={handleClear}
              title="Change Customer"
            >
              <i className="bi bi-arrow-repeat me-1"></i> Change
            </button>
          </div>
        </div>
      ) : (
        /* Searchable Input Control */
        <div>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-primary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            {searchQuery && (
              <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchQuery('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          {/* Floating Dropdown List */}
          {isOpen && (
            <div
              className="position-absolute w-100 bg-white border rounded-3 shadow-lg mt-1 overflow-auto"
              style={{ maxHeight: '280px', top: '100%', left: 0, zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            >
              <div className="p-2 bg-light border-bottom text-muted small fw-semibold d-flex justify-content-between">
                <span>Matching Customers ({filteredCustomers.length})</span>
                {searchQuery && <span>Search: "{searchQuery}"</span>}
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <i className="bi bi-person-x fs-3 d-block mb-1 text-secondary"></i>
                  No customer found matching "{searchQuery}".
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="list-group-item list-group-item-action p-2.5 d-flex align-items-center justify-content-between"
                      onClick={() => handleSelect(c)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {c.photo ? (
                          <img src={c.photo} alt={c.full_name} className="rounded-circle border" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                        ) : (
                          <i className="bi bi-person-circle text-primary fs-5"></i>
                        )}
                        <div>
                          <div className="fw-bold text-dark small">
                            {c.full_name || `${c.first_name} ${c.last_name || ''}`}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            📞 {c.mobile} {c.id_number ? `| 🪪 ${c.id_type || 'ID'}: ${c.id_number}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-light text-primary border">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Full Details Dialogue Box Modal */}
      {selectedCust && showDetailsModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-person-vcard text-primary fs-4"></i>
                  Customer Profile & Proof Documents
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
              </div>

              <div className="modal-body p-4 bg-white">
                {/* Top Profile Header */}
                <div className="p-3 bg-light rounded-3 border mb-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    {selectedCust.photo ? (
                      <img
                        src={selectedCust.photo}
                        alt={selectedCust.full_name}
                        className="rounded-circle border shadow-sm"
                        style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-3 shadow-sm" style={{ width: '64px', height: '64px' }}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                    )}
                    <div>
                      <h4 className="fw-bold text-dark m-0">{selectedCust.full_name || `${selectedCust.first_name} ${selectedCust.last_name || ''}`}</h4>
                      <span className="badge bg-primary mt-1">Registered Customer</span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <span className="text-muted small d-block mb-1"><i className="bi bi-telephone text-success me-1"></i>Mobile Contact</span>
                      <strong className="text-dark fs-6">{selectedCust.mobile || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <span className="text-muted small d-block mb-1"><i className="bi bi-envelope text-info me-1"></i>Email Address</span>
                      <strong className="text-dark fs-6">{selectedCust.email || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <span className="text-muted small d-block mb-1"><i className="bi bi-geo-alt-fill text-danger me-1"></i>Full Address</span>
                      <strong className="text-dark fs-6">{selectedCust.address || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <span className="text-muted small d-block mb-1"><i className="bi bi-card-heading text-warning me-1"></i>Identity Proof Details</span>
                      <strong className="text-dark fs-6">{selectedCust.id_type || 'ID'}: {selectedCust.id_number || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* ID Documents Preview */}
                  <div className="col-md-6">
                    <div className="p-3 border rounded text-center bg-light">
                      <div className="fw-semibold small text-dark mb-2">ID Proof (Front Side)</div>
                      {selectedCust.id_document ? (
                        <a href={selectedCust.id_document} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-bold">
                          <i className="bi bi-file-earmark-text me-1"></i> View Front Document
                        </a>
                      ) : (
                        <span className="text-muted small">No front document uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 border rounded text-center bg-light">
                      <div className="fw-semibold small text-dark mb-2">ID Proof (Back Side)</div>
                      {selectedCust.id_document_back ? (
                        <a href={selectedCust.id_document_back} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-bold">
                          <i className="bi bi-file-earmark-text me-1"></i> View Back Document
                        </a>
                      ) : (
                        <span className="text-muted small">No back document uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* Additional Uploaded Documents */}
                  {selectedCust.documents && selectedCust.documents.length > 0 && (
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold text-dark mb-2"><i className="bi bi-folder-fill me-2 text-warning"></i>Additional Attached Documents</h6>
                      <div className="row g-2">
                        {selectedCust.documents.map((doc) => (
                          <div key={doc.id} className="col-md-6">
                            <div className="p-2 border rounded bg-white d-flex align-items-center justify-content-between">
                              <span className="fw-semibold small text-dark">{doc.title}</span>
                              <a href={doc.document_file} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-primary py-0 px-2" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-eye"></i> View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary fw-bold" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCustomerSelect;
