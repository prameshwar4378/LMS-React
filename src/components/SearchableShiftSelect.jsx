import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Clock, Check, ChevronDown, User, X } from 'lucide-react';

/**
 * SearchableShiftSelect
 * 
 * An executive, searchable dropdown selector for shifts.
 * Replaces standard HTML <select> with instant search, cashier details, 
 * live status badges (Open/Closed), and clean keyboard/outside click management.
 * 
 * Uses React Portal to guarantee the floating options menu floats directly on top of 
 * the entire document hierarchy, never hidden or clipped behind sibling cards or sections.
 */
const SearchableShiftSelect = ({
  shifts = [],
  selectedShiftId,
  onSelectShift,
  placeholder = "Select Target Shift...",
  theme = 'light', // 'light' or 'dark' (for header/banner usage)
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'CLOSED'
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 340,
    maxHeight: 380,
    openUpwards: false
  });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected shift
  const selectedShift = useMemo(() => {
    if (!selectedShiftId) return null;
    return shifts.find(s => String(s.id) === String(selectedShiftId)) || null;
  }, [shifts, selectedShiftId]);

  // Recalculate dropdown screen coordinates
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 300 && spaceAbove > spaceBelow;

    // Minimum width of 360px or trigger width, bounded by viewport
    const width = Math.min(Math.max(rect.width, 360), window.innerWidth - 24);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    if (left < 12) left = 12;

    const availableSpace = openUpwards ? (spaceAbove - 20) : (spaceBelow - 20);
    const calculatedMaxHeight = Math.min(420, Math.max(220, availableSpace));

    setDropdownPos({
      top: openUpwards ? (rect.top - 8) : (rect.bottom + 8),
      left,
      width,
      maxHeight: calculatedMaxHeight,
      openUpwards
    });
  }, []);

  // Close dropdown on outside click or Escape key, reposition on window scroll/resize
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e) => {
      // Don't reposition/close if user is scrolling inside the options list itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      // Auto-focus search input when opened
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Filtered shifts based on query and status filter
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Status filter
      if (statusFilter === 'OPEN' && s.status !== 'OPEN') return false;
      if (statusFilter === 'CLOSED' && s.status === 'OPEN') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const numMatch = (s.shift_number || '').toLowerCase().includes(q);
      const userMatch = (s.user_name || '').toLowerCase().includes(q);
      const statusMatch = (s.status_display || s.status || '').toLowerCase().includes(q);
      const openedMatch = (s.opened_at || '').toLowerCase().includes(q);
      const tillMatch = (s.cash_drawer_code || '').toLowerCase().includes(q);

      return numMatch || userMatch || statusMatch || openedMatch || tillMatch;
    });
  }, [shifts, searchQuery, statusFilter]);

  const openCount = useMemo(() => shifts.filter(s => s.status === 'OPEN').length, [shifts]);
  const closedCount = useMemo(() => shifts.filter(s => s.status !== 'OPEN').length, [shifts]);

  const handleSelect = (sId) => {
    onSelectShift(sId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`position-relative w-100 ${className}`} ref={containerRef}>
      {/* 1. TRIGGER BUTTON */}
      <button
        type="button"
        className="w-100 d-flex align-items-center justify-content-between text-start transition-all"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid #CBD5E1',
          borderRadius: '10px',
          padding: '9px 14px',
          minHeight: '42px',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="d-flex align-items-center gap-2.5 overflow-hidden me-2">
          <Clock size={16} className="text-primary flex-shrink-0" />
          
          {selectedShift ? (
            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
              <span className="fw-bold text-dark extra-small text-truncate font-monospace" style={{ letterSpacing: '-0.01em' }}>
                Shift #{selectedShift.shift_number}
              </span>
              <span className="text-secondary extra-small text-truncate d-none d-sm-inline">
                &bull; {selectedShift.user_name}
              </span>
              <span
                className="badge rounded-pill extra-small px-2.5 py-0.5 fw-bold"
                style={{
                  backgroundColor: selectedShift.status === 'OPEN' ? '#DCFCE7' : '#F1F5F9',
                  color: selectedShift.status === 'OPEN' ? '#15803D' : '#475569',
                  border: `1px solid ${selectedShift.status === 'OPEN' ? '#86EFAC' : '#CBD5E1'}`,
                  flexShrink: 0,
                  fontSize: '10.5px'
                }}
              >
                {selectedShift.status === 'OPEN' ? '● Open' : 'Closed'}
              </span>
            </div>
          ) : (
            <span className="text-muted extra-small">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className="text-secondary transition-transform flex-shrink-0 ms-2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>

      {/* 2. FLOATING SEARCHABLE DROPDOWN MENU (PORTAL) */}
      {typeof document !== 'undefined' && isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white rounded-4 shadow-2xl border overflow-hidden"
          style={{
            position: 'fixed',
            top: dropdownPos.openUpwards ? undefined : `${dropdownPos.top}px`,
            bottom: dropdownPos.openUpwards ? `${window.innerHeight - dropdownPos.top}px` : undefined,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 99999,
            borderColor: '#CBD5E1',
            boxShadow: '0 20px 45px -8px rgba(15, 23, 42, 0.35), 0 8px 20px -4px rgba(15, 23, 42, 0.15)'
          }}
        >
          {/* A. Search Input Header with Generous Padding */}
          <div className="p-3 border-bottom bg-light">
            <div className="input-group input-group-sm mb-2 shadow-2xs rounded-3 overflow-hidden border bg-white">
              <span className="input-group-text bg-white border-0 text-muted ps-2.5 pe-1">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control border-0 bg-white extra-small py-1.5"
                placeholder="Type shift #, cashier, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ boxShadow: 'none' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn bg-white border-0 text-muted extra-small px-2"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills with Distinct Separation */}
            <div className="d-flex align-items-center gap-2 pt-0.5">
              <button
                type="button"
                className={`btn btn-xs py-1 px-2.5 rounded-pill extra-small fw-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'btn-dark text-white shadow-2xs'
                    : 'btn-outline-secondary bg-white text-secondary'
                }`}
                style={{ fontSize: '11px' }}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({shifts.length})
              </button>
              <button
                type="button"
                className={`btn btn-xs py-1 px-2.5 rounded-pill extra-small fw-semibold transition-all ${
                  statusFilter === 'OPEN'
                    ? 'btn-success text-white shadow-2xs'
                    : 'btn-outline-success bg-white text-success'
                }`}
                style={{ fontSize: '11px' }}
                onClick={() => setStatusFilter('OPEN')}
              >
                ● Open ({openCount})
              </button>
              <button
                type="button"
                className={`btn btn-xs py-1 px-2.5 rounded-pill extra-small fw-semibold transition-all ${
                  statusFilter === 'CLOSED'
                    ? 'btn-secondary text-white shadow-2xs'
                    : 'btn-outline-secondary bg-white text-secondary'
                }`}
                style={{ fontSize: '11px' }}
                onClick={() => setStatusFilter('CLOSED')}
              >
                Closed ({closedCount})
              </button>
            </div>
          </div>

          {/* B. Scrollable Shift Options List with Card-Level Padding & Margins */}
          <div
            className="p-2 overflow-y-auto d-flex flex-column gap-1.5"
            style={{
              maxHeight: `${Math.max(180, dropdownPos.maxHeight - 130)}px`,
              backgroundColor: '#F8FAFC'
            }}
          >
            {filteredShifts.length > 0 ? (
              filteredShifts.map((s) => {
                const isSelected = String(s.id) === String(selectedShiftId);
                const isOpenShift = s.status === 'OPEN';

                return (
                  <div
                    key={s.id}
                    className="p-2.5 px-3 rounded-3 cursor-pointer transition-all d-flex align-items-center justify-content-between shadow-2xs"
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      border: isSelected ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                      borderLeft: isSelected ? '4px solid #2563EB' : '4px solid #94A3B8',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelect(s.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }
                    }}
                  >
                    <div className="overflow-hidden me-2">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-bold text-dark extra-small font-monospace">
                          Shift #{s.shift_number}
                        </span>
                        <span
                          className="badge rounded-pill fw-bold"
                          style={{
                            backgroundColor: isOpenShift ? '#DCFCE7' : '#F1F5F9',
                            color: isOpenShift ? '#15803D' : '#475569',
                            border: `1px solid ${isOpenShift ? '#86EFAC' : '#CBD5E1'}`,
                            fontSize: '10px',
                            padding: '2px 8px',
                            lineHeight: '1.2'
                          }}
                        >
                          {isOpenShift ? '● Active / Open' : 'Closed'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2 text-muted flex-wrap" style={{ fontSize: '11.5px' }}>
                        <span className="d-flex align-items-center gap-1.5 text-truncate">
                          <User size={12} className="text-secondary flex-shrink-0" />
                          <strong className="text-dark">{s.user_name}</strong>
                        </span>
                        <span className="text-muted">&bull;</span>
                        <span className="text-secondary text-truncate">
                          {s.opened_at}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        className="p-1 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs ms-2"
                        style={{ width: 22, height: 22 }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-muted bg-white rounded-3 border">
                <Search size={22} className="mb-1 text-secondary opacity-50" />
                <div className="extra-small fw-bold text-dark">No matching shifts found</div>
                <div className="text-muted mt-0.5" style={{ fontSize: '11px' }}>
                  Try a different shift number, date, or cashier name
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-xs btn-link text-primary mt-2 extra-small p-0 fw-semibold text-decoration-none"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search query
                  </button>
                )}
              </div>
            )}
          </div>

          {/* C. Footer Note with Generous Breathing Room */}
          <div
            className="py-2.5 px-3 border-top bg-light d-flex align-items-center justify-content-between text-muted"
            style={{ fontSize: '11.5px' }}
          >
            <span className="text-secondary">
              Showing <strong className="text-dark">{filteredShifts.length}</strong> of {shifts.length} shifts
            </span>
            <span className="fw-bold text-primary extra-small">
              Shift-wise Reporting
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableShiftSelect;
