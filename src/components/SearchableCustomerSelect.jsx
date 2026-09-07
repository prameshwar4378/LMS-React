import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../utils/dateUtils';
import { searchCustomersApi } from '../api/customerApi';

const SearchableCustomerSelect = ({
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  placeholder = "Search customer by name or mobile number..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [remoteResults, setRemoteResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cachedSelectedCust, setCachedSelectedCust] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync cached customer when selectedCustomerId or customer lists change
  useEffect(() => {
    if (!selectedCustomerId) {
      setCachedSelectedCust(null);
      return;
    }
    const found =
      (customers || []).find((c) => String(c.id) === String(selectedCustomerId)) ||
      remoteResults.find((c) => String(c.id) === String(selectedCustomerId));

    if (found) {
      setCachedSelectedCust(found);
    }
  }, [selectedCustomerId, customers, remoteResults]);

  const selectedCust =
    cachedSelectedCust ||
    (customers || []).find((c) => String(c.id) === String(selectedCustomerId));

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

  // Debounced live server search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchCustomersApi(trimmed);
        setRemoteResults(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to search customers remotely:', err);
        setRemoteResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine and deduplicate local matches + remote server search results
  const queryLower = searchQuery.toLowerCase().trim();
  const queryDigits = searchQuery.replace(/\D/g, '');

  const localMatches = (customers || []).filter((c) => {
    if (!queryLower) return true;
    const first = (c.first_name || '').toLowerCase();
    const middle = (c.middle_name || '').toLowerCase();
    const last = (c.last_name || '').toLowerCase();
    const full = (c.full_name || `${first} ${middle} ${last}`).toLowerCase();
    const mobile = (c.mobile || '').toLowerCase();
    const mobileDigits = (c.mobile || '').replace(/\D/g, '');
    const idNum = (c.id_number || '').toLowerCase();
    const email = (c.email || '').toLowerCase();

    const nameMatch = first.includes(queryLower) || middle.includes(queryLower) || last.includes(queryLower) || full.includes(queryLower);
    const mobileMatch = mobile.includes(queryLower) || (queryDigits && mobileDigits.includes(queryDigits));
    const idMatch = idNum.includes(queryLower);
    const emailMatch = email.includes(queryLower);

    return nameMatch || mobileMatch || idMatch || emailMatch;
  });

  const customerMap = new Map();
  // Add local matches first
  localMatches.forEach((c) => customerMap.set(String(c.id), c));
  // Merge remote results
  remoteResults.forEach((c) => {
    if (!customerMap.has(String(c.id))) {
      customerMap.set(String(c.id), c);
    }
  });

  const displayCustomers = Array.from(customerMap.values());

  const handleSelect = (cust) => {
    setCachedSelectedCust(cust);
    onSelectCustomer(cust.id, cust);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setCachedSelectedCust(null);
    onSelectCustomer('');
    setSearchQuery('');
    setHighlightedIndex(-1);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || displayCustomers.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < displayCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : displayCustomers.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < displayCustomers.length) {
        handleSelect(displayCustomers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
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
                style={{ width: '46px', height: '46px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
                style={{ width: '46px', height: '46px', fontWeight: 'bold', fontSize: '1.1rem' }}
              >
                {(selectedCust.first_name || 'G')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-6">
                  {selectedCust.full_name || `${selectedCust.first_name || ''} ${selectedCust.last_name || ''}`.trim() || 'Customer Profile'}
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                  ✓ Selected
                </span>
              </div>
              <div className="small text-muted mt-0.5 d-flex flex-wrap align-items-center gap-2">
                <span className="text-dark fw-semibold">
                  <i className="bi bi-telephone-fill text-success me-1"></i>
                  {selectedCust.mobile || 'No Mobile'}
                </span>
                {selectedCust.id_number && (
                  <span className="text-secondary">
                    | <i className="bi bi-card-heading text-warning me-1"></i>
                    {selectedCust.id_type || 'ID'}: {selectedCust.id_number}
                  </span>
                )}
                {selectedCust.email && (
                  <span className="text-muted d-none d-md-inline">
                    | <i className="bi bi-envelope text-info me-1"></i>
                    {selectedCust.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary fw-semibold shadow-xs d-flex align-items-center gap-1"
              onClick={() => setShowDetailsModal(true)}
            >
              <i className="bi bi-person-lines-fill"></i> View Details
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger fw-semibold d-flex align-items-center gap-1"
              onClick={handleClear}
              title="Change Customer"
            >
              <i className="bi bi-arrow-repeat"></i> Change
            </button>
          </div>
        </div>
      ) : (
        /* Searchable Input Control */
        <div>
          <div className="input-group input-group-lg border rounded-3 overflow-hidden bg-white">
            <span className="input-group-text bg-white border-0 text-primary ps-3">
              {isSearching ? (
                <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              ) : (
                <i className="bi bi-search fs-6"></i>
              )}
            </span>
            <input
              ref={inputRef}
              type="text"
              className="form-control border-0 bg-white shadow-none ps-2 py-2.5"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                className="btn btn-link text-secondary text-decoration-none pe-3"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedIndex(-1);
                }}
                title="Clear search"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          {/* Floating Suggestion Dropdown List */}
          {isOpen && (
            <div
              className="position-absolute w-100 bg-white border rounded-3 shadow-lg mt-1 overflow-hidden"
              style={{ maxHeight: '340px', top: '100%', left: 0, zIndex: 9999, boxShadow: '0 12px 35px rgba(0,0,0,0.18)' }}
            >
              {/* Header Bar with Live Result Count */}
              <div className="p-2.5 bg-light border-bottom text-muted small fw-semibold d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-1.5 text-dark">
                  <i className="bi bi-people-fill text-primary"></i>
                  {searchQuery.trim() ? (
                    <>Matching Customers ({displayCustomers.length})</>
                  ) : (
                    <>Recent Directory Customers ({displayCustomers.slice(0, 8).length})</>
                  )}
                </span>
                {isSearching ? (
                  <span className="text-primary extra-small fw-normal d-flex align-items-center gap-1">
                    <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                    Searching database...
                  </span>
                ) : searchQuery.trim() ? (
                  <span className="text-muted extra-small">Search: "{searchQuery}"</span>
                ) : (
                  <span className="text-muted extra-small">Type name or mobile to filter</span>
                )}
              </div>

              {displayCustomers.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-person-x fs-2 d-block mb-2 text-secondary"></i>
                  <div className="fw-semibold text-dark">No customer found matching "{searchQuery}"</div>
                  <div className="extra-small text-muted mt-1">
                    No records found by name or mobile number. Switch to "+ Register & Create New Customer Profile" to add this guest.
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '285px' }}>
                  {(searchQuery.trim() ? displayCustomers : displayCustomers.slice(0, 8)).map((c, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const cFullName = c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Guest';

                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`list-group-item list-group-item-action p-2.5 d-flex align-items-center justify-content-between border-bottom ${
                          isHighlighted ? 'bg-primary-subtle' : ''
                        }`}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onClick={() => handleSelect(c)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={cFullName}
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                              style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}
                            >
                              {(c.first_name || 'G')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="text-start">
                            <div className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                              <span>{cFullName}</span>
                              <span className="badge bg-light text-secondary border extra-small py-0 px-1.5" style={{ fontSize: '0.65rem' }}>
                                #{c.id}
                              </span>
                            </div>
                            <div className="d-flex flex-wrap align-items-center gap-2 mt-0.5" style={{ fontSize: '0.78rem' }}>
                              <span className="text-success fw-bold">
                                <i className="bi bi-telephone-fill me-1"></i>{c.mobile || 'No mobile'}
                              </span>
                              {c.id_number && (
                                <span className="text-muted">
                                  | <i className="bi bi-card-text text-warning me-1"></i>
                                  {c.id_type || 'ID'}: {c.id_number}
                                </span>
                              )}
                              {c.city && (
                                <span className="text-muted d-none d-sm-inline">
                                  | {c.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white px-2.5 py-1.5 rounded-pill shadow-xs">
                            Select Guest <i className="bi bi-chevron-right ms-1"></i>
                          </span>
                        </div>
                      </button>
                    );
                  })}
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
