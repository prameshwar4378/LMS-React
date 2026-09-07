import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomersApi, createCustomerApi, updateCustomerApi, deleteCustomerApi } from '../api/customerApi';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/mediaUtils';
import { useNotification } from '../context/NotificationContext';
import { compressImage } from '../utils/imageCompressor';
import { exportCustomersToExcel, exportCustomersToPDF } from '../utils/exportUtils';

const Customers = () => {
  const { user, selectedProperty } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;

  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading: loading, refetch: loadCustomers } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomersApi(search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

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
  const [docBackFile, setDocBackFile] = useState(null);
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

  // -------------------------------------------------------------
  // Column Visibility & Definitions
  // -------------------------------------------------------------
  const columnDefs = [
    { key: 'photo', label: 'Photo' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'city_address', label: 'City / Address' },
    { key: 'id_proof', label: 'ID Proof' },
    { key: 'stay_history', label: 'Stay History' },
    { key: 'actions', label: 'Actions' },
  ];

  const [columnVisibility, setColumnVisibility] = useState({
    photo: true,
    full_name: true,
    mobile: true,
    city_address: true,
    id_proof: true,
    stay_history: true,
    actions: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Close column visibility dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumnVisibility = (key) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility({
      photo: true,
      full_name: true,
      mobile: true,
      city_address: true,
      id_proof: true,
      stay_history: true,
      actions: true,
    });
  };

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length || 1;

  // -------------------------------------------------------------
  // Column-wise Sorting State & Logic
  // -------------------------------------------------------------
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedCustomers = useMemo(() => {
    if (!customers || !customers.length) return [];
    const list = [...customers];

    return list.sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case 'full_name':
          valA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).toLowerCase();
          valB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).toLowerCase();
          break;
        case 'mobile':
          valA = (a.mobile || '').replace(/[^0-9]/g, '');
          valB = (b.mobile || '').replace(/[^0-9]/g, '');
          break;
        case 'city_address':
          valA = (a.city || a.state || a.address || '').toLowerCase();
          valB = (b.city || b.state || b.address || '').toLowerCase();
          break;
        case 'id_proof':
          valA = (a.id_number || '').toLowerCase();
          valB = (b.id_number || '').toLowerCase();
          break;
        case 'stay_history':
          valA = parseInt(a.stay_count, 10) || 0;
          valB = parseInt(b.stay_count, 10) || 0;
          break;
        case 'created_at':
        default:
          valA = new Date(a.created_at || '1970-01-01').getTime();
          valB = new Date(b.created_at || '1970-01-01').getTime();
          break;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA);
      valB = String(valB);
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [customers, sortColumn, sortDirection]);

  // -------------------------------------------------------------
  // Pagination State & Calculations
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedCustomers = useMemo(() => {
    return sortedCustomers.slice(startIndex, endIndex);
  }, [sortedCustomers, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    exportCustomersToExcel(sortedCustomers, { search }, selectedProperty);
  };

  const handleExportPDF = () => {
    exportCustomersToPDF(sortedCustomers, { search }, selectedProperty);
  };

  // -------------------------------------------------------------
  // Import Modal & CSV Logic
  // -------------------------------------------------------------
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [parsedImportRows, setParsedImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState('');
  const importFileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];

    const parseRow = (rowText) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const rawHeaders = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const getIndex = (...possibleNames) => {
      return rawHeaders.findIndex((h) => possibleNames.some((name) => h === name || h.includes(name)));
    };

    const fnIdx = getIndex('first_name', 'firstname', 'fname', 'first', 'name');
    const mnIdx = getIndex('middle_name', 'middlename', 'mname');
    const lnIdx = getIndex('last_name', 'lastname', 'lname', 'surname');
    const mobIdx = getIndex('mobile', 'phone', 'contact');
    const altMobIdx = getIndex('alt_mobile', 'alternate_mobile', 'alt_phone');
    const emailIdx = getIndex('email', 'mail');
    const genderIdx = getIndex('gender', 'sex');
    const cityIdx = getIndex('city', 'town');
    const stateIdx = getIndex('state', 'province');
    const addrIdx = getIndex('address', 'addr');
    const idTypeIdx = getIndex('id_type', 'idtype', 'doc_type');
    const idNumIdx = getIndex('id_number', 'idnumber', 'aadhaar', 'doc_number');

    const parsedRecords = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const firstName = fnIdx !== -1 ? row[fnIdx] : '';
      const middleName = mnIdx !== -1 ? row[mnIdx] : '';
      const lastName = lnIdx !== -1 ? row[lnIdx] : '';
      const mobile = mobIdx !== -1 ? row[mobIdx] : '';
      const altMobile = altMobIdx !== -1 ? row[altMobIdx] : '';
      const email = emailIdx !== -1 ? row[emailIdx] : '';
      const gender = genderIdx !== -1 ? row[genderIdx] || 'Male' : 'Male';
      const city = cityIdx !== -1 ? row[cityIdx] : '';
      const state = stateIdx !== -1 ? row[stateIdx] : '';
      const address = addrIdx !== -1 ? row[addrIdx] : '';
      const idType = idTypeIdx !== -1 ? row[idTypeIdx] || 'Aadhaar' : 'Aadhaar';
      const idNumber = idNumIdx !== -1 ? row[idNumIdx] : '';

      const isValid = Boolean(firstName && mobile);
      parsedRecords.push({
        firstName,
        middleName,
        lastName,
        fullName: [firstName, middleName, lastName].filter(Boolean).join(' '),
        mobile,
        altMobile,
        email,
        gender: ['male', 'female', 'other'].includes(gender.toLowerCase()) ? gender : 'Male',
        city,
        state,
        address,
        idType: idType || 'Aadhaar',
        idNumber,
        isValid,
        error: !firstName ? 'Missing First Name' : !mobile ? 'Missing Mobile' : null,
      });
    }

    return parsedRecords;
  };

  const handleDownloadSampleCSV = () => {
    const headers = 'First Name,Middle Name,Last Name,Mobile,Alternate Mobile,Email,Gender,City,State,Address,ID Type,ID Number';
    const sampleRow1 = 'Rameshwar,Ambadas,Pawar,07776824564,,prameshwar4378@gmail.com,Male,Aurangabad,Maharashtra,At. Takali Sagaj Tq. Vaijapur,Aadhaar,985202755898';
    const sampleRow2 = 'Sunil,Kisan,Sharma,09823145678,,sunil.sharma@example.com,Male,Pune,Maharashtra,Shivaji Nagar,Aadhaar,541298741234';
    const csvContent = '\uFEFF' + [headers, sampleRow1, sampleRow2].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_customer_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportError('No valid data rows found in the CSV file.');
        }
        setParsedImportRows(parsed);
      } catch (err) {
        setImportError('Failed to parse CSV file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedImportRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError('No valid customer records to import.');
      return;
    }

    setImporting(true);
    setImportError('');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const formData = new FormData();
        formData.append('first_name', row.firstName);
        if (row.middleName) formData.append('middle_name', row.middleName);
        if (row.lastName) formData.append('last_name', row.lastName);
        formData.append('mobile', row.mobile);
        if (row.altMobile) formData.append('alternate_mobile', row.altMobile);
        if (row.email) formData.append('email', row.email);
        formData.append('gender', row.gender || 'Male');
        if (row.address) formData.append('address', row.address);
        if (row.city) formData.append('city', row.city);
        if (row.state) formData.append('state', row.state);
        formData.append('id_type', row.idType || 'Aadhaar');
        if (row.idNumber) formData.append('id_number', row.idNumber);

        await createCustomerApi(formData);
        successCount++;
      } catch (err) {
        failCount++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['customers'] });

    if (successCount > 0) {
      showSuccess(
        `Import completed! ${successCount} guest profile(s) added successfully.${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        'Import Complete'
      );
      setShowImportModal(false);
      setImportFile(null);
      setParsedImportRows([]);
      setImportProgress(0);
    } else {
      setImportError(`Failed to import records. ${failCount} errors encountered.`);
    }
  };

  const renderSortHeader = (label, columnKey, className = '') => (
    <th
      className={`${className} text-nowrap`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => handleSort(columnKey)}
      title={`Sort by ${label} (${sortColumn === columnKey && sortDirection === 'asc' ? 'Descending' : 'Ascending'})`}
    >
      <div className="d-inline-flex align-items-center gap-1.5">
        <span>{label}</span>
        {sortColumn === columnKey ? (
          sortDirection === 'asc' ? (
            <i className="bi bi-arrow-up text-primary fw-bold" style={{ fontSize: '0.75rem' }}></i>
          ) : (
            <i className="bi bi-arrow-down text-primary fw-bold" style={{ fontSize: '0.75rem' }}></i>
          )
        ) : (
          <i className="bi bi-arrow-down-up text-muted opacity-25" style={{ fontSize: '0.7rem' }}></i>
        )}
      </div>
    </th>
  );

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
    setDocBackFile(null);
    setEditingCustomer(null);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
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
    setDocBackFile(null);
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

    try {
      // Compress images before sending to make upload 10x-20x faster
      if (photoFile) {
        const compressedPhoto = await compressImage(photoFile);
        formData.append('photo', compressedPhoto);
      }
      if (docFile) {
        const compressedDoc = await compressImage(docFile);
        formData.append('id_document', compressedDoc);
      }
      if (docBackFile) {
        const compressedDocBack = await compressImage(docBackFile);
        formData.append('id_document_back', compressedDocBack);
      }

      let savedCustomer;
      if (editingCustomer) {
        savedCustomer = await updateCustomerApi(editingCustomer.id, formData);
        showSuccess(`Customer "${savedCustomer.full_name || firstName}" updated successfully.`, 'Customer Updated');
      } else {
        savedCustomer = await createCustomerApi(formData);
        showSuccess(`Customer "${savedCustomer.full_name || firstName}" added successfully.`, 'Customer Added');
      }
      setShowModal(false);
      resetForm();

      // Direct cache update: insert or update customer immediately without full re-download
      queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
        if (!Array.isArray(old)) return [savedCustomer];
        if (editingCustomer) {
          return old.map((c) => (c.id === savedCustomer.id ? savedCustomer : c));
        }
        return [savedCustomer, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
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
        // Optimistic delete: Close modal immediately and remove customer in 0.0s
        setConfirmModal({ show: false });
        const prevCustomers = queryClient.getQueryData(['customers', search]);
        queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item) => item.id !== c.id);
        });
        showSuccess(`Customer profile '${c.full_name}' deleted successfully.`, 'Customer Deleted');

        try {
          await deleteCustomerApi(c.id);
          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        } catch (err) {
          // Rollback if server rejects
          if (prevCustomers) {
            queryClient.setQueryData(['customers', search], prevCustomers);
          }
          showError(err.response?.data?.error || 'Error deleting customer record.', 'Deletion Failed');
        }
      },
    });
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
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          {/* Table Header Bar with Entries & Top-Right Export / Import / Column Visibility */}
          <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            {/* Left: Page Size Selector & Count Badge */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-semibold">Show</span>
              <select
                className="form-select form-select-sm border-secondary-subtle"
                style={{ width: '70px', height: '31px', fontSize: '0.8rem', cursor: 'pointer' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-muted small">entries</span>
              <span className="badge bg-light text-secondary border ms-1 px-2 py-1 extra-small">
                {totalItems} records
              </span>
            </div>

            {/* EXACT TOP RIGHT CORNER: Column Visibility + Import + Excel & PDF Small Buttons */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              {/* Column Visibility Dropdown */}
              <div className="dropdown position-relative" ref={columnMenuRef}>
                <button
                  type="button"
                  className={`btn btn-sm ${showColumnMenu ? 'btn-secondary text-white' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs`}
                  style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  title="Customize visible columns"
                >
                  <i className="bi bi-sliders2"></i>
                  <span>Columns</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
                </button>

                {showColumnMenu && (
                  <div
                    className="dropdown-menu dropdown-menu-end show p-2 shadow-lg border-0 rounded-3 mt-1"
                    style={{ minWidth: '200px', zIndex: 1060 }}
                  >
                    <div className="d-flex justify-content-between align-items-center px-2 py-1 mb-1 border-bottom">
                      <span className="fw-bold extra-small text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>
                        Visible Columns
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-xs p-0 text-primary text-decoration-none fw-semibold"
                        style={{ fontSize: '0.7rem' }}
                        onClick={resetColumnVisibility}
                      >
                        Reset All
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1 pt-1">
                      {columnDefs.map((col) => (
                        <label
                          key={col.key}
                          className="dropdown-item d-flex align-items-center gap-2 py-1 px-2 rounded cursor-pointer small m-0"
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={columnVisibility[col.key]}
                            onChange={() => toggleColumnVisibility(col.key)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Small Professional Import Button */}
              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setParsedImportRows([]);
                  setImportError('');
                  setShowImportModal(true);
                }}
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Bulk Import Customers from CSV"
              >
                <i className="bi bi-file-earmark-arrow-up-fill text-primary"></i>
                <span>Import</span>
              </button>

              {/* Small Professional Excel Export Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export Customer Directory to Excel (.xls)"
              >
                <i className="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Excel</span>
              </button>

              {/* Small Professional PDF Export Button */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export Customer Directory to PDF Report"
              >
                <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light text-muted small text-uppercase fw-bold">
                  <tr>
                    {columnVisibility.photo && <th className="ps-4" style={{ width: '60px' }}>Photo</th>}
                    {columnVisibility.full_name && renderSortHeader('Full Name', 'full_name')}
                    {columnVisibility.mobile && renderSortHeader('Mobile', 'mobile')}
                    {columnVisibility.city_address && renderSortHeader('City / Address', 'city_address')}
                    {columnVisibility.id_proof && renderSortHeader('ID Proof', 'id_proof')}
                    {columnVisibility.stay_history && renderSortHeader('Stay History', 'stay_history')}
                    {columnVisibility.actions && <th className="text-end pe-4 text-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="text-center py-5 text-muted">
                        <i className="bi bi-person-x fs-1 d-block text-muted opacity-50 mb-2"></i>
                        No customer profiles found matching your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr key={c.id}>
                        {columnVisibility.photo && (
                          <td className="ps-4">
                            {c.photo ? (
                              <img
                                src={getMediaUrl(c.photo)}
                                alt={c.full_name}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                className="rounded-circle object-fit-cover shadow-sm border"
                                style={{ width: '42px', height: '42px' }}
                              />
                            ) : (
                              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: '42px', height: '42px' }}>
                                {c.first_name ? c.first_name[0].toUpperCase() : 'G'}
                              </div>
                            )}
                          </td>
                        )}

                        {columnVisibility.full_name && (
                          <td>
                            <div className="fw-bold text-dark">{c.full_name}</div>
                            <span className="text-muted small">{c.email || 'No email registered'}</span>
                          </td>
                        )}

                        {columnVisibility.mobile && (
                          <td className="fw-bold text-primary">
                            <i className="bi bi-telephone me-1 text-muted"></i>{c.mobile}
                          </td>
                        )}

                        {columnVisibility.city_address && (
                          <td>
                            <div className="fw-semibold text-dark">{c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : c.address || 'N/A'}</div>
                            {c.address && c.city && <span className="text-muted extra-small">{c.address}</span>}
                          </td>
                        )}

                        {columnVisibility.id_proof && (
                          <td>
                            <span className="badge bg-light text-dark border fw-semibold">
                              {c.id_type}: {c.id_number || 'N/A'}
                            </span>
                          </td>
                        )}

                        {columnVisibility.stay_history && (
                          <td>
                            <span className="badge bg-info text-white fw-bold">
                              <i className="bi bi-journal-check me-1"></i>{c.stay_count || 0} Stay(s)
                            </span>
                          </td>
                        )}

                        {columnVisibility.actions && (
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
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="card-footer bg-white py-2.5 px-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="text-muted small">
                Showing <span className="fw-semibold text-dark">{startIndex + 1}</span> to{' '}
                <span className="fw-semibold text-dark">{endIndex}</span> of{' '}
                <span className="fw-semibold text-dark">{totalItems}</span> customers
              </div>

              {totalPages > 1 && (
                <nav aria-label="Customer directory pagination">
                  <ul className="pagination pagination-sm m-0 gap-1 align-items-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link rounded px-2.5 py-1"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <i className="bi bi-chevron-left" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </li>

                    {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                      if (page === '...') {
                        return (
                          <li key={`ellipsis-${idx}`} className="page-item disabled">
                            <span className="page-link border-0 bg-transparent px-1.5 text-muted">...</span>
                          </li>
                        );
                      }
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            type="button"
                            className="page-link rounded px-2.5 py-1"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link rounded px-2.5 py-1"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '780px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className={`bi ${editingCustomer ? 'bi-person-gear' : 'bi-person-plus-fill'} fs-5`}></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      {editingCustomer ? `Edit Customer Profile — ${editingCustomer.full_name}` : 'Add New Customer Profile'}
                    </h5>
                    <span className="text-secondary extra-small">
                      Enter guest demographic details, contact information, and statutory ID proofs.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveCustomer}>
                <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                  {formError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{formError}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-person"></i> Personal & Demographic Information
                    </div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">First Name *</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Rameshwar" />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Middle Name</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Last Name</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pawar" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Mobile Number *</label>
                        <input type="text" className="form-control py-2.5 font-semibold" style={{ height: '46px' }} required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9823012345" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Alternate Mobile</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={altMobile} onChange={(e) => setAltMobile(e.target.value)} placeholder="Secondary contact" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Email Address</label>
                        <input type="email" className="form-control py-2.5" style={{ height: '46px' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Gender</label>
                        <select className="form-select py-2.5" style={{ height: '46px' }} value={gender} onChange={(e) => setGender(e.target.value)}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-dark mb-1">Residential Address</label>
                        <textarea className="form-control p-2.5" rows="2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, landmark..."></textarea>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">City</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">State</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-card-checklist"></i> Statutory ID Proof & Documents
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">ID Proof Type *</label>
                        <select className="form-select py-2.5" style={{ height: '46px' }} value={idType} onChange={(e) => setIdType(e.target.value)}>
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving Licence">Driving Licence</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">ID Proof Number</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 1234-5678-9012" />
                      </div>

                      {/* Camera Capture / Photo Upload */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1 d-block">Customer Photo Snapshot</label>
                        <div className="d-flex align-items-center gap-2">
                          <button type="button" className="btn btn-outline-primary py-2 px-3 rounded-3 fw-semibold" onClick={() => setShowCamera(true)}>
                            <i className="bi bi-camera me-1"></i> Capture Camera
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control py-2"
                            style={{ height: '44px' }}
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
                            <img src={photoPreview} alt="Preview" className="img-thumbnail rounded-3 border object-fit-cover" style={{ height: '70px', width: '70px' }} />
                          </div>
                        )}
                      </div>

                      {/* ID Document (Front Side) */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1 d-block">ID Document (Front Side)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="form-control py-2"
                          style={{ height: '44px' }}
                          onChange={(e) => setDocFile(e.target.files[0] || null)}
                        />
                      </div>

                      {/* ID Document (Back Side) */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1 d-block">ID Document (Back Side)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="form-control py-2"
                          style={{ height: '44px' }}
                          onChange={(e) => setDocBackFile(e.target.files[0] || null)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> {editingCustomer ? 'Save Profile Changes' : 'Create Customer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT CUSTOMERS MODAL */}
      {showImportModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-file-earmark-arrow-up-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem' }}>
                      Import Customer Directory
                    </h5>
                    <span className="text-secondary extra-small">
                      Bulk upload guest profiles via CSV spreadsheet file
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowImportModal(false)} disabled={importing}></button>
              </div>

              <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {/* Info & Sample Download */}
                <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                      <span className="fw-bold text-dark d-block small">CSV File Format Requirements</span>
                      <span className="text-muted extra-small">
                        Required fields: <strong className="text-dark">First Name</strong> and <strong className="text-dark">Mobile Number</strong>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSampleCSV}
                      className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 shadow-2xs text-primary fw-semibold"
                      style={{ fontSize: '0.785rem' }}
                    >
                      <i className="bi bi-download"></i>
                      <span>Download Sample CSV</span>
                    </button>
                  </div>
                </div>

                {importError && (
                  <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{importError}
                  </div>
                )}

                {/* File Drop / Select Area */}
                <div
                  className="border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer bg-white hover-bg-light transition-all mb-3"
                  onClick={() => importFileInputRef.current?.click()}
                  style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
                >
                  <input
                    type="file"
                    ref={importFileInputRef}
                    accept=".csv,text/csv,text/plain"
                    className="d-none"
                    onChange={handleFileSelect}
                  />
                  <div className="text-primary mb-2">
                    <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">
                    {importFile ? importFile.name : 'Click to select CSV file or drag & drop'}
                  </h6>
                  <span className="text-muted extra-small">
                    Supports .csv files with UTF-8 encoding
                  </span>
                </div>

                {/* Progress bar when importing */}
                {importing && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small fw-semibold text-dark mb-1">
                      <span>Importing Guest Profiles...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                        role="progressbar"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Parsed Rows Preview */}
                {parsedImportRows.length > 0 && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small text-dark">
                        Preview ({parsedImportRows.filter((r) => r.isValid).length} valid of {parsedImportRows.length} rows)
                      </span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle extra-small">
                        {parsedImportRows.filter((r) => r.isValid).length} Ready to Import
                      </span>
                    </div>

                    <div className="table-responsive border rounded-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover align-middle m-0" style={{ fontSize: '0.785rem' }}>
                        <thead className="table-light text-muted text-uppercase extra-small">
                          <tr>
                            <th className="ps-3">#</th>
                            <th>Status</th>
                            <th>Full Name</th>
                            <th>Mobile</th>
                            <th>City / Address</th>
                            <th>ID Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedImportRows.slice(0, 15).map((row, idx) => (
                            <tr key={idx}>
                              <td className="ps-3 text-muted">{idx + 1}</td>
                              <td>
                                {row.isValid ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle extra-small">
                                    <i className="bi bi-check-circle me-1"></i>Valid
                                  </span>
                                ) : (
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle extra-small">
                                    <i className="bi bi-x-circle me-1"></i>{row.error}
                                  </span>
                                )}
                              </td>
                              <td className="fw-semibold text-dark">{row.fullName || '—'}</td>
                              <td>{row.mobile || '—'}</td>
                              <td>{row.city ? `${row.city}${row.state ? `, ${row.state}` : ''}` : row.address || '—'}</td>
                              <td>{row.idNumber ? `${row.idType}: ${row.idNumber}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedImportRows.length > 15 && (
                      <span className="text-muted extra-small d-block mt-1">
                        Showing first 15 rows of {parsedImportRows.length}...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm fw-semibold px-3"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-semibold px-4 d-inline-flex align-items-center gap-1.5"
                  onClick={handleExecuteImport}
                  disabled={importing || parsedImportRows.filter((r) => r.isValid).length === 0}
                >
                  {importing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill"></i>
                      <span>Import {parsedImportRows.filter((r) => r.isValid).length} Guests</span>
                    </>
                  )}
                </button>
              </div>
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
