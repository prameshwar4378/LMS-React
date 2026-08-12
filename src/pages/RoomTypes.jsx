import React, { useEffect, useState } from 'react';
import { getRoomTypesApi, createRoomTypeApi, updateRoomTypeApi, deleteRoomTypeApi } from '../api/roomApi';
import { formatCurrency } from '../utils/formatCurrency';

const RoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(2);
  const [amenities, setAmenities] = useState('AC, TV, WiFi, Attached Bathroom');

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    setLoading(true);
    try {
      const data = await getRoomTypesApi();
      setRoomTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rt = null) => {
    if (rt) {
      setEditingId(rt.id);
      setName(rt.name);
      setDescription(rt.description || '');
      setBasePrice(rt.base_price);
      setMaxAdults(rt.max_adults);
      setMaxChildren(rt.max_children);
      setAmenities(rt.amenities || '');
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setBasePrice('');
      setMaxAdults(2);
      setMaxChildren(2);
      setAmenities('AC, TV, WiFi, Attached Bathroom');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      base_price: parseFloat(basePrice),
      max_adults: parseInt(maxAdults),
      max_children: parseInt(maxChildren),
      amenities,
    };

    try {
      if (editingId) {
        await updateRoomTypeApi(editingId, payload);
      } else {
        await createRoomTypeApi(payload);
      }
      setShowModal(false);
      loadRoomTypes();
    } catch (err) {
      alert('Error saving room type.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room type?')) {
      try {
        await deleteRoomTypeApi(id);
        loadRoomTypes();
      } catch (err) {
        alert('Cannot delete room type in use.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-dark">Room Types Configuration</h4>
          <span className="text-muted small">Configure base pricing, guest capacity, and room amenities</span>
        </div>
        <button className="btn btn-primary fw-semibold shadow-sm" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-1"></i> Create Room Type
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-4">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                  <h5 className="fw-bold m-0 text-primary">{rt.name}</h5>
                  <span className="fs-5 fw-bold text-success">{formatCurrency(rt.base_price)} <small className="text-muted fs-6">/ night</small></span>
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">{rt.description || 'No description provided.'}</p>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-2 bg-light rounded border text-center">
                        <div className="text-muted small">Max Adults</div>
                        <div className="fw-bold fs-6">{rt.max_adults} Adults</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-light rounded border text-center">
                        <div className="text-muted small">Max Children</div>
                        <div className="fw-bold fs-6">{rt.max_children} Children</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold small text-muted mb-1">Included Amenities:</div>
                    <div className="d-flex flex-wrap gap-1">
                      {rt.amenities ? (
                        rt.amenities.split(',').map((am, idx) => (
                          <span key={idx} className="badge bg-secondary-subtle text-secondary border">
                            <i className="bi bi-check2 me-1 text-success"></i>{am.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted small">None specified</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                  <span className="text-muted small"><i className="bi bi-door-closed me-1"></i> {rt.room_count || 0} Total Rooms</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenModal(rt)}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rt.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Type Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editingId ? 'Edit Room Type' : 'Create Room Type'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Room Type Name *</label>
                    <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deluxe AC Room" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Base Price (₹ / Night) *</label>
                    <input type="number" step="0.01" className="form-control" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="1800.00" />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Max Adults</label>
                      <input type="number" min="1" className="form-control" value={maxAdults} onChange={(e) => setMaxAdults(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Max Children</label>
                      <input type="number" min="0" className="form-control" value={maxChildren} onChange={(e) => setMaxChildren(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Amenities (Comma-separated)</label>
                    <textarea className="form-control" rows="2" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="AC, Smart TV, WiFi, Geyser, Attached Bathroom"></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description"></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><i className="bi bi-check-circle me-1"></i> Save Room Type</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypes;
