import React, { useState, useEffect, useRef } from 'react';
import { getChargeTypesApi, createChargeTypeApi } from '../api/billingApi';
import { useNotification } from '../context/NotificationContext';
import {
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Plus,
  Sparkles,
  Check,
  ChevronDown,
  Tag,
  X,
  PlusCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const ChargeFormModal = ({ show, onClose, onSubmit, stayId }) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Primary Form State
  const [chargeTypes, setChargeTypes] = useState([]);
  const [selectedChargeTypeId, setSelectedChargeTypeId] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // Date & Time States
  const [chargeDate, setChargeDate] = useState('');
  const [chargeTime, setChargeTime] = useState('');

  // Searchable Category Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Create Category Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('0');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatActive, setNewCatActive] = useState(true);
  const [catError, setCatError] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  const setToLiveDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    setChargeDate(`${year}-${month}-${day}`);
    setChargeTime(`${hours}:${mins}`);
  };

  const loadChargeTypes = async () => {
    try {
      const data = await getChargeTypesApi();
      setChargeTypes(data || []);
      return data || [];
    } catch (err) {
      console.error("Error loading charge categories:", err);
      return [];
    }
  };

  useEffect(() => {
    if (show) {
      setToLiveDateTime();
      loadChargeTypes();
      setDropdownOpen(false);
      setSearchQuery('');
    }
  }, [show]);

  // Close searchable dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [dropdownOpen]);

  const handleChargeTypeSelect = (ct) => {
    if (ct === 'CUSTOM') {
      setSelectedChargeTypeId('CUSTOM');
      setDescription('');
      setUnitPrice(0);
    } else {
      setSelectedChargeTypeId(ct.id);
      setDescription(ct.name);
      setUnitPrice(ct.default_price || 0);
    }
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const handleOpenCreateCategory = () => {
    setDropdownOpen(false);
    setNewCatName(searchQuery.trim());
    setNewCatPrice('0');
    setNewCatDesc('');
    setNewCatActive(true);
    setCatError('');
    setShowCreateModal(true);
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    setCatError('');

    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setCatError('Category Name is required.');
      return;
    }

    // Check client-side duplicate name
    const exists = chargeTypes.some(
      (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setCatError('Category already exists.');
      return;
    }

    setCatSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        default_price: parseFloat(newCatPrice || 0),
        description: newCatDesc.trim(),
        is_active: newCatActive,
      };

      const newCategory = await createChargeTypeApi(payload);

      // Show professional success toast
      showSuccess('New charge category created successfully.', 'Category Created');

      // Refresh list
      const updatedList = await loadChargeTypes();

      // Find created category from updated list or fallback to response
      const targetCategory =
        updatedList.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase()) ||
        newCategory;

      // Auto-select newly created category in the charge form
      if (targetCategory && targetCategory.id) {
        setSelectedChargeTypeId(targetCategory.id);
        setDescription(targetCategory.name);
        setUnitPrice(targetCategory.default_price || 0);
      }

      // Close create modal
      setShowCreateModal(false);
      setNewCatName('');
      setNewCatPrice('0');
      setNewCatDesc('');
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.name?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Error creating charge category.';
      setCatError(errMsg);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const payload = {
      stay: stayId,
      charge_type: selectedChargeTypeId && selectedChargeTypeId !== 'CUSTOM' ? parseInt(selectedChargeTypeId) : null,
      description: description.trim(),
      quantity: parseInt(quantity || 1),
      unit_price: parseFloat(unitPrice || 0),
    };

    if (chargeDate) {
      const timeStr = chargeTime || '12:00';
      payload.charge_date = `${chargeDate}T${timeStr}:00`;
    }

    onSubmit(payload);
  };

  if (!show) return null;

  const totalAmount = (parseInt(quantity || 0) * parseFloat(unitPrice || 0)).toFixed(2);
  const isCustom = !selectedChargeTypeId || selectedChargeTypeId === 'CUSTOM';

  // Selected Category Label helper
  const getSelectedLabel = () => {
    if (selectedChargeTypeId === 'CUSTOM') {
      return '✨ + Enter Custom Item / Other Charge';
    }
    const match = chargeTypes.find((item) => item.id === parseInt(selectedChargeTypeId));
    return match ? `${match.name} (Default: ₹${match.default_price})` : 'Select Charge Item / Category';
  };

  // Filter categories by search query
  const filteredCategories = chargeTypes.filter((ct) =>
    ct.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* MAIN MODAL: ADD EXTRA CHARGE / SERVICE */}
      <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
            
            {/* Header */}
            <div className="modal-header bg-warning text-dark py-3.5 px-4 d-flex align-items-center justify-content-between">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: '1.1rem' }}>
                <i className="bi bi-cart-plus-fill me-1"></i> Add Extra Charge / Service
              </h5>
              <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4 bg-white">
                
                {/* Editable Charge Date & Time Section */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold text-dark m-0 d-flex align-items-center gap-1.5">
                      <Calendar size={15} className="text-warning-emphasis" /> Charge Date & Time *
                    </label>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-dark py-0.5 px-2 rounded-2 text-decoration-none d-flex align-items-center gap-1"
                      style={{ fontSize: '0.725rem' }}
                      onClick={setToLiveDateTime}
                      title="Reset to current live system datetime"
                    >
                      <RefreshCw size={12} /> Set Live Time
                    </button>
                  </div>

                  <div className="row g-2">
                    <div className="col-7">
                      <label className="form-label extra-small text-muted mb-1">Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm font-semibold"
                        required
                        value={chargeDate}
                        onChange={(e) => setChargeDate(e.target.value)}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label extra-small text-muted mb-1">Time</label>
                      <input
                        type="time"
                        className="form-control form-control-sm font-semibold"
                        required
                        value={chargeTime}
                        onChange={(e) => setChargeTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="extra-small text-muted mt-1.5">
                    🕒 Recorded Datetime: <strong>{formatDate(chargeDate)} @ {chargeTime || '12:00'}</strong>
                  </div>
                </div>

                {/* SEARCHABLE CATEGORY SELECT DROPDOWN */}
                <div className="mb-3 position-relative" ref={dropdownRef}>
                  <label className="form-label small fw-semibold text-dark mb-1">Select Charge Item / Category</label>
                  
                  {/* Select Trigger Box */}
                  <div
                    className={`form-select border-warning-subtle d-flex align-items-center justify-content-between cursor-pointer py-2.5 px-3 rounded-3 bg-white ${
                      dropdownOpen ? 'border-primary shadow-sm' : ''
                    }`}
                    style={{ minHeight: '44px' }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className={`small text-truncate ${selectedChargeTypeId === 'CUSTOM' ? 'fw-bold text-dark' : 'fw-semibold text-dark'}`}>
                      {getSelectedLabel()}
                    </span>
                    <ChevronDown size={18} className="text-secondary ms-2 flex-shrink-0" />
                  </div>

                  {/* Dropdown Popup */}
                  {dropdownOpen && (
                    <div
                      className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 shadow-lg border overflow-hidden"
                      style={{ zIndex: 1070 }}
                    >
                      {/* Search Bar inside Popup */}
                      <div className="p-2 border-bottom bg-light d-flex align-items-center gap-2">
                        <Search size={16} className="text-muted ms-1 flex-shrink-0" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="form-control form-control-sm border-0 shadow-none bg-transparent"
                          placeholder="Search charge item or category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="btn btn-xs text-muted p-0 me-1"
                            onClick={() => setSearchQuery('')}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Filtered Category Items List */}
                      <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                        {/* Always Show Custom Charge Option First */}
                        {('custom charge enter custom').includes(searchQuery.toLowerCase()) && (
                          <div
                            className={`px-3 py-2.5 small d-flex align-items-center justify-content-between cursor-pointer border-bottom hover-bg-light ${
                              selectedChargeTypeId === 'CUSTOM' ? 'bg-primary-subtle text-primary fw-bold' : 'text-dark'
                            }`}
                            onClick={() => handleChargeTypeSelect('CUSTOM')}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Sparkles size={16} className="text-warning flex-shrink-0" />
                              <span>+ Enter Custom Item / Other Charge</span>
                            </div>
                            {selectedChargeTypeId === 'CUSTOM' && <Check size={16} className="text-primary" />}
                          </div>
                        )}

                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((ct) => {
                            const isSelected = selectedChargeTypeId === ct.id;
                            return (
                              <div
                                key={ct.id}
                                className={`px-3 py-2.5 small d-flex align-items-center justify-content-between cursor-pointer hover-bg-light ${
                                  isSelected ? 'bg-primary-subtle text-primary fw-bold' : 'text-dark'
                                }`}
                                onClick={() => handleChargeTypeSelect(ct)}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <Tag size={15} className="text-secondary flex-shrink-0" />
                                  <span>{ct.name}</span>
                                  <span className="text-muted extra-small ms-1">(Default: ₹{ct.default_price})</span>
                                </div>
                                {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-3 text-center text-muted extra-small">
                            No matching charge category found.
                          </div>
                        )}
                      </div>

                      {/* CREATE NEW CATEGORY OPTION (ALWAYS AT BOTTOM) */}
                      <div
                        className="p-2.5 border-top bg-light d-flex align-items-center justify-content-center gap-2 text-primary font-bold cursor-pointer hover-bg-primary-subtle transition-all"
                        style={{ fontSize: '0.875rem' }}
                        onClick={handleOpenCreateCategory}
                      >
                        <PlusCircle size={16} />
                        <span>+ Create New Category</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom or Selected Charge Description */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">
                    {isCustom ? 'Custom Charge Title / Service Name *' : 'Item Description / Title *'}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${isCustom ? 'border-primary fw-bold' : ''}`}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isCustom
                        ? 'e.g. Airport Transfer / Broken Glass / Special Meal / Doctor Fee'
                        : 'Enter charge description'
                    }
                  />
                  {isCustom && (
                    <div className="form-text text-primary extra-small mt-1">
                      <i className="bi bi-info-circle me-1"></i>
                      You can type any custom charge or service name here.
                    </div>
                  )}
                </div>

                {/* Quantity & Unit Price */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-dark">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-dark">Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control fw-bold text-dark"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Total Calculation Display */}
                <div className="p-3 bg-light rounded-3 border text-end">
                  <span className="text-muted me-2 small">Total Amount:</span>
                  <span className="fs-4 fw-bold text-success">₹{totalAmount}</span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light border fw-semibold px-4" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning fw-bold px-4 shadow-sm">
                  <i className="bi bi-plus-lg me-1"></i> Add Charge to Bill
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      {/* COMPACT MODAL: CREATE NEW CHARGE CATEGORY */}
      {showCreateModal && (
        <div
          className="modal fade show d-block modal-backdrop-animated"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1080 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              {/* Header */}
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <Tag size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                      Create New Charge Category
                    </h5>
                    <span className="text-secondary extra-small">
                      Add a new item category for room service, amenities, or extra guest charges.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateCategorySubmit}>
                <div className="modal-body p-4 bg-white">
                  {catError && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-center gap-2 rounded-3 border-danger-subtle">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{catError}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      className="form-control py-2.5 font-bold"
                      style={{ height: '44px' }}
                      required
                      placeholder="e.g. Room Service / Food & Beverage / Extra Bed"
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (catError) setCatError('');
                      }}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-7">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Default Unit Price (₹)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control border-start-0 py-2.5 font-bold text-success"
                          style={{ height: '44px' }}
                          placeholder="0.00"
                          value={newCatPrice}
                          onChange={(e) => setNewCatPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-5">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Status
                      </label>
                      <select
                        className="form-select py-2.5 font-semibold"
                        style={{ height: '44px' }}
                        value={newCatActive ? 'active' : 'inactive'}
                        onChange={(e) => setNewCatActive(e.target.value === 'active')}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      className="form-control p-2.5 extra-small"
                      rows="2"
                      placeholder="Brief description of this charge category..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-light border fw-semibold px-4 py-2 rounded-3"
                    onClick={() => setShowCreateModal(false)}
                    disabled={catSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                    disabled={catSubmitting}
                  >
                    {catSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} /> Create Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChargeFormModal;
