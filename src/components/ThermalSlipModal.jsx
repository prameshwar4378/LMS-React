import React, { useState, useEffect } from 'react';
import { getSettingsApi } from '../api/settingsApi';
import {
  generateShiftThermalHtml,
  generateExpenseThermalHtml,
  printThermalContent
} from '../utils/thermalPrinter';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Sliders,
  Receipt
} from 'lucide-react';

const ThermalSlipModal = ({
  isOpen,
  onClose,
  shift,
  expense,
  mode = 'shift' // 'shift' | 'expense'
}) => {
  const [width, setWidth] = useState('80mm'); // '80mm' | '58mm'
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getSettingsApi()
        .then(setSettings)
        .catch((err) => console.error('Failed to load lodge settings:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const htmlContent = mode === 'shift' && shift
    ? generateShiftThermalHtml(shift, settings, width)
    : expense
    ? generateExpenseThermalHtml(expense, shift || {}, settings, width)
    : '';

  const handlePrint = () => {
    printThermalContent(htmlContent, mode === 'shift' ? `Shift_${shift?.shift_number}` : `Expense_Voucher`);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          
          {/* Modal Header */}
          <div className="modal-header border-0 text-white p-3.5" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '38px', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Printer size={19} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                  {mode === 'shift' ? 'Thermal Till Closing Slip' : 'Thermal Petty Cash Voucher'}
                </h5>
                <span className="text-white-50 extra-small">
                  ESC/POS 80mm &amp; 58mm Roll Receipt Layout
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* Width Selector Bar */}
          <div className="px-4 py-2.5 bg-light border-bottom d-flex align-items-center justify-content-between">
            <span className="extra-small text-secondary fw-bold text-uppercase d-flex align-items-center gap-1">
              <Sliders size={13} /> Paper Width:
            </span>
            <div className="btn-group btn-group-sm rounded-3 p-0.5 bg-white border">
              <button
                type="button"
                className={`btn btn-xs fw-bold px-3 py-1 rounded-2 ${width === '80mm' ? 'btn-primary text-white shadow-xs' : 'btn-light text-secondary'}`}
                style={{ backgroundColor: width === '80mm' ? '#2563EB' : 'transparent' }}
                onClick={() => setWidth('80mm')}
              >
                80mm (Standard POS)
              </button>
              <button
                type="button"
                className={`btn btn-xs fw-bold px-3 py-1 rounded-2 ${width === '58mm' ? 'btn-primary text-white shadow-xs' : 'btn-light text-secondary'}`}
                style={{ backgroundColor: width === '58mm' ? '#2563EB' : 'transparent' }}
                onClick={() => setWidth('58mm')}
              >
                58mm (Mini POS)
              </button>
            </div>
          </div>

          {/* Body: Thermal Roll Preview Container */}
          <div className="modal-body p-4 d-flex justify-content-center bg-slate-200" style={{ backgroundColor: '#E2E8F0', maxHeight: '65vh', overflowY: 'auto' }}>
            <div
              className="bg-white p-3 shadow-sm rounded-1 border"
              style={{
                width: width === '80mm' ? '300px' : '230px',
                fontFamily: `'Courier New', Courier, monospace, monospace`,
                fontSize: width === '80mm' ? '11px' : '9px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              {/* Render iframe content directly inside container for pixel-perfect preview */}
              <iframe
                title="Thermal Receipt Preview"
                srcDoc={htmlContent}
                style={{
                  width: '100%',
                  height: '520px',
                  border: 'none',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-light text-secondary border px-3.5 py-2 rounded-3 small fw-semibold"
              onClick={onClose}
            >
              Close
            </button>
            
            <button
              type="button"
              className="btn btn-primary px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-2 text-white"
              style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
              onClick={handlePrint}
            >
              <Printer size={16} /> Print {width} Thermal Slip
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ThermalSlipModal;
