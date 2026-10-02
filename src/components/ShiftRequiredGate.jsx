import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext';
import {
  Clock,
  Lock,
  ArrowRight,
  ShieldAlert,
  Coins,
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const ShiftRequiredGate = ({
  children,
  actionName = 'perform guest check-ins, reservations, or payment transactions',
  title = 'Active Cashier Shift Required'
}) => {
  const navigate = useNavigate();
  const { requiresActiveShift, openShiftModal, refetchShift, isLoadingShift } = useShift();

  // If active shift is not required (e.g. SINGLE_OWNER mode, or shift is already active), render children directly
  if (!requiresActiveShift) {
    return <>{children}</>;
  }

  return (
    <div className="container-fluid py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-6">
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #FDE68A',
              boxShadow: '0 20px 40px -15px rgba(217, 119, 6, 0.12)'
            }}
          >
            {/* Top Warning Banner Accent */}
            <div
              style={{
                height: '6px',
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #B45309 100%)'
              }}
            />

            <div className="p-4 p-md-5 text-center">
              {/* Badge */}
              <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-warning-subtle text-warning-emphasis fw-bold mb-4" style={{ fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                <ShieldAlert size={14} />
                <span>SHIFT-WISE POLICY ACTIVE • TILL CLOSED</span>
              </div>

              {/* Pulsing Lock / Cash Till Icon */}
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={{
                    width: '84px',
                    height: '84px',
                    backgroundColor: '#FEF3C7',
                    boxShadow: '0 0 0 12px rgba(254, 243, 199, 0.5)'
                  }}
                >
                  <Lock size={38} className="text-warning-emphasis" />
                  <span
                    className="position-absolute bottom-0 end-0 rounded-circle bg-warning text-white p-1 d-flex align-items-center justify-content-center"
                    style={{ width: '26px', height: '26px', border: '2px solid #FFFFFF' }}
                  >
                    <Clock size={14} />
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="fw-bolder text-dark mb-2" style={{ letterSpacing: '-0.02em' }}>
                {title}
              </h3>

              {/* Description */}
              <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '460px', lineHeight: 1.6 }}>
                This hotel operates in <strong className="text-dark">Shift-Wise mode</strong>. Front desk staff cannot{' '}
                <strong className="text-dark">{actionName}</strong> until your cashier shift till is opened with an initial physical cash float.
              </p>

              {/* Policy Features Breakdown */}
              <div
                className="text-start rounded-3 p-3 mb-4 mx-auto"
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  maxWidth: '460px'
                }}
              >
                <div className="fw-bold text-warning-emphasis small mb-2 d-flex align-items-center gap-1.5">
                  <Coins size={14} />
                  <span>Locked Front Desk Capabilities:</span>
                </div>
                <ul className="list-unstyled mb-0 small text-secondary" style={{ fontSize: '0.8rem', lineHeight: 1.7 }}>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-danger fw-bold">✕</span> Walk-In Check-In & Room Allocation
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-danger fw-bold">✕</span> Reservation Creation & Advance Cash Receipts
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-danger fw-bold">✕</span> Payment Transactions, Folio Settlements & Refunds
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-danger fw-bold">✕</span> Shift Expense Cash Payouts
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                <button
                  type="button"
                  className="btn btn-warning fw-bold px-4 py-2.5 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 text-dark w-100 w-sm-auto"
                  onClick={openShiftModal}
                  style={{
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B',
                    fontSize: '0.9rem'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Open Shift Till Now</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                  onClick={() => navigate('/shifts')}
                  style={{ fontSize: '0.9rem' }}
                >
                  <span>Shift & Till Center</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Manual Refresh Status */}
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-secondary text-decoration-none p-0 d-inline-flex align-items-center gap-1"
                  onClick={refetchShift}
                  disabled={isLoadingShift}
                  style={{ fontSize: '0.75rem' }}
                >
                  <RotateCcw size={12} className={isLoadingShift ? 'spin' : ''} />
                  <span>Already opened in another window? Click to re-check till status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftRequiredGate;
